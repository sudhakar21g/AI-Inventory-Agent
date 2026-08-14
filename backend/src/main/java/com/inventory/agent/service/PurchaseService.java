package com.inventory.agent.service;

import com.inventory.agent.dto.PurchaseRequest;
import com.inventory.agent.entity.Product;
import com.inventory.agent.entity.Purchase;
import com.inventory.agent.entity.Supplier;
import com.inventory.agent.exception.ResourceNotFoundException;
import com.inventory.agent.repository.ProductRepository;
import com.inventory.agent.repository.PurchaseRepository;
import com.inventory.agent.repository.SupplierRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@Transactional
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;

    public PurchaseService(PurchaseRepository purchaseRepository,
                           ProductRepository productRepository,
                           SupplierRepository supplierRepository) {
        this.purchaseRepository = purchaseRepository;
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
    }

    @Transactional(readOnly = true)
    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Purchase getPurchaseById(Long id) {
        return purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id: " + id));
    }

    public Purchase createPurchase(PurchaseRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));

        Purchase purchase = new Purchase();
        purchase.setProduct(product);
        purchase.setSupplier(supplier);
        purchase.setQuantity(request.getQuantity());
        purchase.setUnitCost(request.getUnitCost());
        purchase.setPurchaseDate(request.getPurchaseDate() != null ? request.getPurchaseDate() : LocalDateTime.now());

        return purchaseRepository.save(purchase);
    }

    public Purchase updatePurchaseStatus(Long id, String status) {
        Purchase purchase = getPurchaseById(id);
        purchase.setStatus(status);
        return purchaseRepository.save(purchase);
    }

    @Transactional(readOnly = true)
    public List<Purchase> getPurchasesByDateRange(LocalDate start, LocalDate end) {
        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(LocalTime.MAX);
        return purchaseRepository.findByPurchaseDateBetween(startDateTime, endDateTime);
    }
}
