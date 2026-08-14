package com.inventory.agent.controller;

import com.inventory.agent.entity.Sale;
import com.inventory.agent.dto.SaleRequest;
import com.inventory.agent.service.SalesService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
public class SalesController {

    private final SalesService salesService;

    public SalesController(SalesService salesService) {
        this.salesService = salesService;
    }

    @GetMapping
    public ResponseEntity<List<Sale>> getAllSales() {
        return ResponseEntity.ok(salesService.getAllSales());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sale> getSaleById(@PathVariable Long id) {
        return ResponseEntity.ok(salesService.getSaleById(id));
    }

    @PostMapping
    public ResponseEntity<Sale> createSale(@RequestBody SaleRequest request) {
        return ResponseEntity.ok(salesService.createSale(request));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<Sale>> getSalesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(salesService.getSalesByDateRange(start, end));
    }

    @GetMapping("/stats/total")
    public ResponseEntity<Map<String, Object>> getTotalSalesStats() {
        return ResponseEntity.ok(salesService.getTotalSalesStats());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSalesStats() {
        return ResponseEntity.ok(salesService.getSalesStats());
    }
}
