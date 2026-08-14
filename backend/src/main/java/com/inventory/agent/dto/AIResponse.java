package com.inventory.agent.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIResponse {

    private Boolean success;
    private String message;
    private Object data;
    private LocalDateTime timestamp;
}
