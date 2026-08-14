package com.inventory.agent.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_movements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Product is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotBlank(message = "Movement type is required")
    @Column(nullable = false, length = 20)
    private String movementType;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    @Column(nullable = false)
    private Integer quantity;

    @Size(max = 50, message = "Reference number must not exceed 50 characters")
    @Column(length = 50)
    private String referenceNumber;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    @Column(length = 500)
    private String notes;

    @Size(max = 50, message = "Created by must not exceed 50 characters")
    @Column(length = 50)
    private String createdBy;

    @Column(nullable = false)
    private LocalDateTime movementDate;

    public InventoryMovement(Product product, String movementType, Integer quantity,
                             String referenceNumber, String notes, String createdBy) {
        this.product = product;
        this.movementType = movementType;
        this.quantity = quantity;
        this.referenceNumber = referenceNumber;
        this.notes = notes;
        this.createdBy = createdBy;
        this.movementDate = LocalDateTime.now();
    }
}
