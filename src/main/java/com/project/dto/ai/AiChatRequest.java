package com.project.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

@Data
public class AiChatRequest {

    @Valid
    @NotEmpty(message = "请先输入问题")
    private List<AiChatMessage> messages;

    private Integer productId;
}
