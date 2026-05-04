package com.project.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AiChatResponse {

    private String reply;
    private Integer productId;
    private String productName;
    private boolean productContextUsed;
}
