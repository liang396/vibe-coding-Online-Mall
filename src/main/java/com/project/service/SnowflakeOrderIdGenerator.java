package com.project.service;

import com.project.config.OrderIdProperties;
import java.util.function.LongSupplier;
import org.springframework.stereotype.Component;

@Component
public class SnowflakeOrderIdGenerator {

    private static final long WORKER_ID_BITS = 10L;
    private static final long SEQUENCE_BITS = 12L;
    private static final long MAX_WORKER_ID = ~(-1L << WORKER_ID_BITS);
    private static final long MAX_SEQUENCE = ~(-1L << SEQUENCE_BITS);
    private static final long WORKER_ID_SHIFT = SEQUENCE_BITS;
    private static final long TIMESTAMP_LEFT_SHIFT = WORKER_ID_BITS + SEQUENCE_BITS;

    private final long epochMillis;
    private final long workerId;
    private final long rollbackToleranceMs;
    private final LongSupplier currentTimeSupplier;

    private long lastTimestamp = -1L;
    private long sequence = 0L;

    public SnowflakeOrderIdGenerator(OrderIdProperties properties) {
        this(properties, System::currentTimeMillis);
    }

    SnowflakeOrderIdGenerator(OrderIdProperties properties, LongSupplier currentTimeSupplier) {
        this.epochMillis = properties.getEpochMillis();
        this.workerId = properties.getWorkerId();
        this.rollbackToleranceMs = properties.getRollbackToleranceMs();
        this.currentTimeSupplier = currentTimeSupplier;

        if (workerId < 0 || workerId > MAX_WORKER_ID) {
            throw new IllegalArgumentException("workerId must be between 0 and " + MAX_WORKER_ID);
        }
        if (epochMillis < 0) {
            throw new IllegalArgumentException("epochMillis must not be negative");
        }
        if (rollbackToleranceMs < 0) {
            throw new IllegalArgumentException("rollbackToleranceMs must not be negative");
        }
    }

    public synchronized long nextId() {
        long timestamp = currentTimeMillis();
        if (timestamp < epochMillis) {
            throw new IllegalStateException("Current time is before the configured Snowflake epoch");
        }

        if (timestamp < lastTimestamp) {
            long drift = lastTimestamp - timestamp;
            if (drift > rollbackToleranceMs) {
                throw new IllegalStateException("System clock moved backwards beyond tolerance: " + drift + "ms");
            }
            timestamp = waitUntilAtLeast(lastTimestamp);
        }

        if (timestamp == lastTimestamp) {
            sequence = (sequence + 1) & MAX_SEQUENCE;
            if (sequence == 0) {
                timestamp = waitUntilNextMillis(lastTimestamp);
            }
        } else {
            sequence = 0L;
        }

        lastTimestamp = timestamp;
        return ((timestamp - epochMillis) << TIMESTAMP_LEFT_SHIFT)
                | (workerId << WORKER_ID_SHIFT)
                | sequence;
    }

    private long currentTimeMillis() {
        return currentTimeSupplier.getAsLong();
    }

    private long waitUntilAtLeast(long targetTimestamp) {
        long timestamp = currentTimeMillis();
        while (timestamp < targetTimestamp) {
            timestamp = currentTimeMillis();
        }
        return timestamp;
    }

    private long waitUntilNextMillis(long currentTimestamp) {
        long timestamp = currentTimeMillis();
        while (timestamp <= currentTimestamp) {
            timestamp = currentTimeMillis();
        }
        return timestamp;
    }
}
