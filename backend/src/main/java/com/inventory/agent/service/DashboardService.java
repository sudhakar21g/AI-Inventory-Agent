package com.inventory.agent.service;

import com.inventory.agent.entity.Product;
import com.inventory.agent.entity.Sale;
import com.inventory.agent.repository.InventoryRepository;
import com.inventory.agent.repository.ProductRepository;
import com.inventory.agent.repository.PurchaseRepository;
import com.inventory.agent.repository.SalesRepository;
import com.inventory.agent.repository.SupplierRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final SalesRepository salesRepository;
    private final PurchaseRepository purchaseRepository;
    private final InventoryRepository inventoryRepository;

    public DashboardService(ProductRepository productRepository,
                            SupplierRepository supplierRepository,
                            SalesRepository salesRepository,
                            PurchaseRepository purchaseRepository,
                            InventoryRepository inventoryRepository) {
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
        this.salesRepository = salesRepository;
        this.purchaseRepository = purchaseRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalProducts = productRepository.count();
        long totalSuppliers = supplierRepository.count();
        long totalSales = salesRepository.count();
        long totalPurchases = purchaseRepository.count();

        long lowStockCount = 0;
        for (var product : productRepository.findByIsActiveTrue()) {
            Integer rawIn = inventoryRepository.findTotalInByProductId(product.getId());
            Integer rawOut = inventoryRepository.findTotalOutByProductId(product.getId());
            int stockIn = rawIn != null ? rawIn : 0;
            int stockOut = rawOut != null ? rawOut : 0;
            int currentStock = stockIn - stockOut;
            Integer reorderLevel = product.getReorderLevel();
            if (reorderLevel != null && currentStock < reorderLevel) {
                lowStockCount++;
            }
        }

        BigDecimal totalSalesRevenue = salesRepository.findTotalSalesAmount();

        List<Map<String, Object>> recentSales = new ArrayList<>();
        salesRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "saleDate"))
        ).getContent().forEach(sale -> {
            Map<String, Object> saleMap = new HashMap<>();
            saleMap.put("id", sale.getId());
            saleMap.put("quantity", sale.getQuantity());
            saleMap.put("unitPrice", sale.getUnitPrice());
            saleMap.put("totalPrice", sale.getTotalPrice());
            saleMap.put("customerName", sale.getCustomerName());
            saleMap.put("saleDate", sale.getSaleDate());
            saleMap.put("status", sale.getStatus());
            if (sale.getProduct() != null) {
                saleMap.put("productName", sale.getProduct().getName());
                saleMap.put("productId", sale.getProduct().getId());
            }
            recentSales.add(saleMap);
        });

        List<Map<String, Object>> recentPurchases = new ArrayList<>();
        purchaseRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "purchaseDate"))
        ).getContent().forEach(purchase -> {
            Map<String, Object> purchaseMap = new HashMap<>();
            purchaseMap.put("id", purchase.getId());
            purchaseMap.put("quantity", purchase.getQuantity());
            purchaseMap.put("unitCost", purchase.getUnitCost());
            purchaseMap.put("totalCost", purchase.getTotalCost());
            purchaseMap.put("purchaseDate", purchase.getPurchaseDate());
            purchaseMap.put("status", purchase.getStatus());
            if (purchase.getProduct() != null) {
                purchaseMap.put("productName", purchase.getProduct().getName());
                purchaseMap.put("productId", purchase.getProduct().getId());
            }
            if (purchase.getSupplier() != null) {
                purchaseMap.put("supplierName", purchase.getSupplier().getName());
                purchaseMap.put("supplierId", purchase.getSupplier().getId());
            }
            recentPurchases.add(purchaseMap);
        });

        stats.put("totalProducts", totalProducts);
        stats.put("totalSuppliers", totalSuppliers);
        stats.put("totalSales", totalSales);
        stats.put("totalPurchases", totalPurchases);
        stats.put("totalSalesRevenue", totalSalesRevenue != null ? totalSalesRevenue : BigDecimal.ZERO);
        stats.put("lowStockProducts", lowStockCount);
        stats.put("recentSales", recentSales);
        stats.put("recentPurchases", recentPurchases);
        stats.put("salesTrend", buildSalesTrend());
        stats.put("categoryDistribution", buildCategoryDistribution());

        return stats;
    }

    private List<Map<String, Object>> buildSalesTrend() {
        List<Sale> allSales = salesRepository.findAll(Sort.by(Sort.Direction.ASC, "saleDate"));

        Map<String, BigDecimal> monthlySales = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            LocalDate month = today.minusMonths(i);
            String key = month.format(DateTimeFormatter.ofPattern("MMM yyyy"));
            monthlySales.put(key, BigDecimal.ZERO);
        }

        for (Sale sale : allSales) {
            if (sale.getSaleDate() != null) {
                String key = sale.getSaleDate().format(DateTimeFormatter.ofPattern("MMM yyyy"));
                if (monthlySales.containsKey(key)) {
                    BigDecimal amount = sale.getTotalPrice() != null ? sale.getTotalPrice() : BigDecimal.ZERO;
                    monthlySales.put(key, monthlySales.get(key).add(amount));
                }
            }
        }

        List<Map<String, Object>> trend = new ArrayList<>();
        monthlySales.forEach((month, amount) -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("label", month);
            entry.put("value", amount);
            trend.add(entry);
        });
        return trend;
    }

    private List<Map<String, Object>> buildCategoryDistribution() {
        List<Product> products = productRepository.findByIsActiveTrue();

        Map<String, Long> categoryCount = products.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getCategory() != null ? p.getCategory() : "Uncategorized",
                        Collectors.counting()
                ));

        List<Map<String, Object>> distribution = new ArrayList<>();
        categoryCount.forEach((category, count) -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("label", category);
            entry.put("value", count);
            distribution.add(entry);
        });
        return distribution;
    }
}
