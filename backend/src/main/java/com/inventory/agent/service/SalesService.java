package com.inventory.agent.service;

import com.inventory.agent.dto.SaleRequest;
import com.inventory.agent.entity.Product;
import com.inventory.agent.entity.Sale;
import com.inventory.agent.exception.ResourceNotFoundException;
import com.inventory.agent.repository.ProductRepository;
import com.inventory.agent.repository.SalesRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class SalesService {

    private final SalesRepository salesRepository;
    private final ProductRepository productRepository;

    public SalesService(SalesRepository salesRepository, ProductRepository productRepository) {
        this.salesRepository = salesRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<Sale> getAllSales() {
        return salesRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Sale getSaleById(Long id) {
        return salesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id: " + id));
    }

    public Sale createSale(SaleRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        Sale sale = new Sale();
        sale.setProduct(product);
        sale.setQuantity(request.getQuantity());
        sale.setUnitPrice(request.getUnitPrice());
        sale.setCustomerName(request.getCustomerName());

        return salesRepository.save(sale);
    }

    @Transactional(readOnly = true)
    public List<Sale> getSalesByDateRange(LocalDate start, LocalDate end) {
        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(LocalTime.MAX);
        return salesRepository.findBySaleDateBetween(startDateTime, endDateTime);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTotalSalesStats() {
        Map<String, Object> stats = new HashMap<>();
        BigDecimal totalAmount = salesRepository.findTotalSalesAmount();
        Long totalQuantity = salesRepository.findTotalQuantitySold();
        long totalTransactions = salesRepository.count();

        stats.put("totalAmount", totalAmount != null ? totalAmount : BigDecimal.ZERO);
        stats.put("totalQuantity", totalQuantity != null ? totalQuantity : 0L);
        stats.put("totalTransactions", totalTransactions);

        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSalesStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSales", salesRepository.count());

        List<Object[]> topSelling = salesRepository.findTopSellingProducts();
        stats.put("topSellingProducts", topSelling);

        BigDecimal totalAmount = salesRepository.findTotalSalesAmount();
        Long totalQuantity = salesRepository.findTotalQuantitySold();
        stats.put("totalAmount", totalAmount != null ? totalAmount : BigDecimal.ZERO);
        stats.put("totalQuantity", totalQuantity != null ? totalQuantity : 0L);

        return stats;
    }
}
