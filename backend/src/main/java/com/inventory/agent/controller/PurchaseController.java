package com.inventory.agent.controller;

import com.inventory.agent.entity.Purchase;
import com.inventory.agent.dto.PurchaseRequest;
import com.inventory.agent.service.PurchaseService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @GetMapping
    public ResponseEntity<List<Purchase>> getAllPurchases() {
        return ResponseEntity.ok(purchaseService.getAllPurchases());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Purchase> getPurchaseById(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseService.getPurchaseById(id));
    }

    @PostMapping
    public ResponseEntity<Purchase> createPurchase(@RequestBody PurchaseRequest request) {
        return ResponseEntity.ok(purchaseService.createPurchase(request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Purchase> updatePurchaseStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(purchaseService.updatePurchaseStatus(id, status));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<Purchase>> getPurchasesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(purchaseService.getPurchasesByDateRange(start, end));
    }
}
