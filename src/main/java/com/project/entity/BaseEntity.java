package com.project.entity;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class BaseEntity implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
