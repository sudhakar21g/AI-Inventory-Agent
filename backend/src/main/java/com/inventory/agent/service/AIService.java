package com.inventory.agent.service;

import com.inventory.agent.entity.Product;
import com.inventory.agent.exception.ResourceNotFoundException;
import com.inventory.agent.repository.InventoryRepository;
import com.inventory.agent.repository.ProductRepository;
import com.inventory.agent.repository.PurchaseRepository;
import com.inventory.agent.repository.SalesRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AIService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final SalesRepository salesRepository;
    private final PurchaseRepository purchaseRepository;
    private final RestTemplate restTemplate;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    public AIService(ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            SalesRepository salesRepository,
            PurchaseRepository purchaseRepository) {
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.salesRepository = salesRepository;
        this.purchaseRepository = purchaseRepository;
        this.restTemplate = new RestTemplate();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getForecast(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        try {
            String url = aiServiceUrl + "/api/ai/forecast/" + productId;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null) {
                return body;
            }
        } catch (Exception ignored) {
        }

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("productId", product.getId());
        fallback.put("productName", product.getName());
        fallback.put("forecast", "AI service unavailable. Manual forecast required.");
        fallback.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return fallback;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getReorderSuggestions() {
        List<Map<String, Object>> suggestions = new ArrayList<>();
        List<Product> allProducts = productRepository.findByIsActiveTrue();

        for (Product product : allProducts) {
            Integer rawIn = inventoryRepository.findTotalInByProductId(product.getId());
            Integer rawOut = inventoryRepository.findTotalOutByProductId(product.getId());
            int stockIn = rawIn != null ? rawIn : 0;
            int stockOut = rawOut != null ? rawOut : 0;
            int currentStock = stockIn - stockOut;

            Integer reorderLevel = product.getReorderLevel();
            if (reorderLevel != null && currentStock <= reorderLevel) {
                Map<String, Object> suggestion = new HashMap<>();
                suggestion.put("productId", product.getId());
                suggestion.put("productName", product.getName());
                suggestion.put("sku", product.getSku());
                suggestion.put("currentStock", currentStock);
                suggestion.put("reorderLevel", reorderLevel);
                suggestion.put("suggestedQuantity", reorderLevel * 2);
                suggestions.add(suggestion);
            }
        }

        return suggestions;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAnomalies() {
        List<Map<String, Object>> anomalies = new ArrayList<>();
        List<Product> allProducts = productRepository.findByIsActiveTrue();

        for (Product product : allProducts) {
            Integer rawIn = inventoryRepository.findTotalInByProductId(product.getId());
            Integer rawOut = inventoryRepository.findTotalOutByProductId(product.getId());
            int stockIn = rawIn != null ? rawIn : 0;
            int stockOut = rawOut != null ? rawOut : 0;
            int currentStock = stockIn - stockOut;

            if (currentStock < 0) {
                Map<String, Object> anomaly = new HashMap<>();
                anomaly.put("productId", product.getId());
                anomaly.put("productName", product.getName());
                anomaly.put("sku", product.getSku());
                anomaly.put("anomalyType", "NEGATIVE_STOCK");
                anomaly.put("currentStock", currentStock);
                anomaly.put("message", "Negative stock detected for product: " + product.getName());
                anomalies.add(anomaly);
            }

            Integer reorderLevel = product.getReorderLevel();
            if (reorderLevel != null && currentStock > reorderLevel * 5) {
                Map<String, Object> anomaly = new HashMap<>();
                anomaly.put("productId", product.getId());
                anomaly.put("productName", product.getName());
                anomaly.put("sku", product.getSku());
                anomaly.put("anomalyType", "EXCESS_STOCK");
                anomaly.put("currentStock", currentStock);
                anomaly.put("message", "Excess stock detected for product: " + product.getName());
                anomalies.add(anomaly);
            }
        }

        return anomalies;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStockHealth() {
        Map<String, Object> health = new HashMap<>();
        List<Product> allProducts = productRepository.findByIsActiveTrue();

        long healthyCount = 0;
        long lowStockCount = 0;
        long outOfStockCount = 0;

        for (Product product : allProducts) {
            Integer rawIn = inventoryRepository.findTotalInByProductId(product.getId());
            Integer rawOut = inventoryRepository.findTotalOutByProductId(product.getId());
            int stockIn = rawIn != null ? rawIn : 0;
            int stockOut = rawOut != null ? rawOut : 0;
            int currentStock = stockIn - stockOut;

            Integer reorderLevel = product.getReorderLevel();
            if (currentStock <= 0) {
                outOfStockCount++;
            } else if (reorderLevel != null && currentStock < reorderLevel) {
                lowStockCount++;
            } else {
                healthyCount++;
            }
        }

        health.put("totalProducts", allProducts.size());
        health.put("healthyProducts", healthyCount);
        health.put("lowStockProducts", lowStockCount);
        health.put("outOfStockProducts", outOfStockCount);
        health.put("healthPercentage", allProducts.isEmpty() ? 0 : (healthyCount * 100.0 / allProducts.size()));

        return health;
    }

    public Map<String, Object> query(String query) {
        try {
            String url = aiServiceUrl + "/api/ai/query";
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("query", query);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestBody, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null) {
                return body;
            }
        } catch (Exception ignored) {
        }

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("success", false);
        fallback.put("message", "AI service unavailable. Please try again later.");
        fallback.put("query", query);
        fallback.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return fallback;
    }
}
