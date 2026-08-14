package com.inventory.agent.service;

import com.inventory.agent.entity.InventoryMovement;
import com.inventory.agent.entity.Product;
import com.inventory.agent.exception.ResourceNotFoundException;
import com.inventory.agent.repository.InventoryRepository;
import com.inventory.agent.repository.ProductRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    public InventoryService(InventoryRepository inventoryRepository, ProductRepository productRepository) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
    }

    public InventoryMovement createMovement(Map<String, Object> movementRequest, String username) {
        Long productId = Long.valueOf(movementRequest.get("productId").toString());
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        String movementType = movementRequest.get("movementType").toString();
        Integer quantity = Integer.valueOf(movementRequest.get("quantity").toString());
        String referenceNumber = movementRequest.getOrDefault("referenceNumber", null) != null
                ? movementRequest.get("referenceNumber").toString() : null;
        String notes = movementRequest.getOrDefault("notes", null) != null
                ? movementRequest.get("notes").toString() : null;

        InventoryMovement movement = new InventoryMovement(product, movementType, quantity, referenceNumber, notes, username);
        movement.setMovementDate(LocalDateTime.now());

        return inventoryRepository.save(movement);
    }

    public List<InventoryMovement> getAllMovements() {
        return inventoryRepository.findAll();
    }

    public List<InventoryMovement> getMovementsByProductId(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }
        return inventoryRepository.findByProductId(productId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStockByProductId(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        Integer totalIn = inventoryRepository.findTotalInByProductId(productId);
        Integer totalOut = inventoryRepository.findTotalOutByProductId(productId);
        int stockIn = totalIn != null ? totalIn : 0;
        int stockOut = totalOut != null ? totalOut : 0;
        int currentStock = stockIn - stockOut;

        Map<String, Object> stockInfo = new HashMap<>();
        stockInfo.put("productId", product.getId());
        stockInfo.put("productName", product.getName());
        stockInfo.put("sku", product.getSku());
        stockInfo.put("totalIn", stockIn);
        stockInfo.put("totalOut", stockOut);
        stockInfo.put("currentStock", currentStock);
        stockInfo.put("reorderLevel", product.getReorderLevel());
        stockInfo.put("isLowStock", product.getReorderLevel() != null && currentStock < product.getReorderLevel());

        return stockInfo;
    }
}
