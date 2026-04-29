package com.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ApiSuccessResponse {

    private boolean success;

    public static ApiSuccessResponse ok() {
        return new ApiSuccessResponse(true);
    }
}
