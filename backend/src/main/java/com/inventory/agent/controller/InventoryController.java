package com.inventory.agent.controller;

import com.inventory.agent.entity.InventoryMovement;
import com.inventory.agent.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/movements")
    public ResponseEntity<InventoryMovement> createMovement(@RequestBody Map<String, Object> movementRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(inventoryService.createMovement(movementRequest, username));
    }

    @GetMapping("/movements")
    public ResponseEntity<List<InventoryMovement>> getAllMovements() {
        return ResponseEntity.ok(inventoryService.getAllMovements());
    }

    @GetMapping("/movements/product/{id}")
    public ResponseEntity<List<InventoryMovement>> getMovementsByProductId(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getMovementsByProductId(id));
    }

    @GetMapping("/stock/{productId}")
    public ResponseEntity<Map<String, Object>> getStockByProductId(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getStockByProductId(productId));
    }
}
