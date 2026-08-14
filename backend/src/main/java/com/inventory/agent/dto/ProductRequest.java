package com.inventory.agent.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;

    @NotBlank(message = "SKU is required")
    private String sku;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Unit price is required")
    @Positive(message = "Unit price must be positive")
    private BigDecimal unitPrice;

    @NotNull(message = "Cost price is required")
    @Positive(message = "Cost price must be positive")
    private BigDecimal costPrice;

    @NotNull(message = "Reorder level is required")
    @Min(value = 0, message = "Reorder level must be at least 0")
    private Integer reorderLevel;

    private String imageUrl;
}
