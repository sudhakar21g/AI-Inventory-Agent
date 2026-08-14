package com.inventory.agent.controller;

import com.inventory.agent.service.AIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/forecast/{productId}")
    public ResponseEntity<Map<String, Object>> getForecast(@PathVariable Long productId) {
        return ResponseEntity.ok(aiService.getForecast(productId));
    }

    @GetMapping("/reorder-suggestions")
    public ResponseEntity<List<Map<String, Object>>> getReorderSuggestions() {
        return ResponseEntity.ok(aiService.getReorderSuggestions());
    }

    @GetMapping("/anomalies")
    public ResponseEntity<List<Map<String, Object>>> getAnomalies() {
        return ResponseEntity.ok(aiService.getAnomalies());
    }

    @GetMapping("/stock-health")
    public ResponseEntity<Map<String, Object>> getStockHealth() {
        return ResponseEntity.ok(aiService.getStockHealth());
    }

    @PostMapping("/query")
    public ResponseEntity<Map<String, Object>> query(@RequestBody Map<String, String> request) {
        String query = request.get("query");
        return ResponseEntity.ok(aiService.query(query));
    }
}
