package com.project.service;

import com.project.config.OrderIdProperties;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.LongSupplier;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SnowflakeOrderIdGeneratorTest {

    @Test
    void nextIdIsMonotonicAcrossMillis() {
        MutableTimeSupplier timeSupplier = new MutableTimeSupplier(2_000L);
        SnowflakeOrderIdGenerator generator = new SnowflakeOrderIdGenerator(properties(), timeSupplier);

        long first = generator.nextId();
        timeSupplier.set(2_001L);
        long second = generator.nextId();

        assertTrue(second > first);
    }

    @Test
    void nextIdIncrementsSequenceWithinSameMillisecond() {
        SnowflakeOrderIdGenerator generator = new SnowflakeOrderIdGenerator(properties(), () -> 2_000L);

        long first = generator.nextId();
        long second = generator.nextId();

        assertEquals(first + 1, second);
        assertEquals(0L, extractSequence(first));
        assertEquals(1L, extractSequence(second));
    }

    @Test
    void nextIdWaitsForNextMillisecondAfterSequenceOverflow() {
        AtomicInteger calls = new AtomicInteger();
        LongSupplier timeSupplier = () -> calls.incrementAndGet() <= 4_098 ? 2_000L : 2_001L;
        SnowflakeOrderIdGenerator generator = new SnowflakeOrderIdGenerator(properties(), timeSupplier);

        long lastIdBeforeOverflow = 0L;
        for (int index = 0; index < 4_096; index++) {
            lastIdBeforeOverflow = generator.nextId();
        }
        long firstIdNextMillis = generator.nextId();

        assertEquals(4_095L, extractSequence(lastIdBeforeOverflow));
        assertEquals(0L, extractSequence(firstIdNextMillis));
        assertEquals(2_001L, extractTimestamp(firstIdNextMillis));
        assertTrue(firstIdNextMillis > lastIdBeforeOverflow);
    }

    @Test
    void nextIdWaitsThroughSmallClockRollbackWithinTolerance() {
        SnowflakeOrderIdGenerator generator = new SnowflakeOrderIdGenerator(
                properties(),
                new ScriptedTimeSupplier(2_005L, 2_003L, 2_004L, 2_005L));

        long first = generator.nextId();
        long second = generator.nextId();

        assertTrue(second > first);
        assertEquals(2_005L, extractTimestamp(second));
        assertEquals(1L, extractSequence(second));
    }

    @Test
    void nextIdFailsFastWhenClockRollbackExceedsTolerance() {
        SnowflakeOrderIdGenerator generator = new SnowflakeOrderIdGenerator(
                properties(),
                new ScriptedTimeSupplier(2_005L, 1_998L));

        generator.nextId();

        IllegalStateException exception = assertThrows(IllegalStateException.class, generator::nextId);
        assertTrue(exception.getMessage().contains("moved backwards beyond tolerance"));
    }

    private OrderIdProperties properties() {
        OrderIdProperties properties = new OrderIdProperties();
        properties.setEpochMillis(1_000L);
        properties.setWorkerId(7L);
        properties.setRollbackToleranceMs(5L);
        return properties;
    }

    private long extractSequence(long id) {
        return id & 0xFFFL;
    }

    private long extractTimestamp(long id) {
        return (id >> 22) + 1_000L;
    }

    private static final class MutableTimeSupplier implements LongSupplier {

        private long value;

        private MutableTimeSupplier(long value) {
            this.value = value;
        }

        @Override
        public long getAsLong() {
            return value;
        }

        private void set(long value) {
            this.value = value;
        }
    }

    private static final class ScriptedTimeSupplier implements LongSupplier {

        private final long[] values;
        private int index = 0;

        private ScriptedTimeSupplier(long... values) {
            this.values = values;
        }

        @Override
        public long getAsLong() {
            if (index >= values.length) {
                return values[values.length - 1];
            }
            return values[index++];
        }
    }
}
