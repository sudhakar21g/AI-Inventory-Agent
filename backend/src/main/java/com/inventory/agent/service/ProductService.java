package com.inventory.agent.service;

import com.inventory.agent.dto.ProductRequest;
import com.inventory.agent.entity.Product;
import com.inventory.agent.repository.InventoryRepository;
import com.inventory.agent.repository.ProductRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    public ProductService(ProductRepository productRepository,
                          InventoryRepository inventoryRepository) {
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    public Product createProduct(ProductRequest request) {
        if (productRepository.findBySku(request.getSku()).isPresent()) {
            throw new RuntimeException("Product with SKU already exists: " + request.getSku());
        }

        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setSku(request.getSku());
        product.setCategory(request.getCategory());
        product.setUnitPrice(request.getUnitPrice());
        product.setCostPrice(request.getCostPrice());
        product.setReorderLevel(request.getReorderLevel());
        product.setImageUrl(request.getImageUrl());
        product.setIsActive(true);

        return productRepository.save(product);
    }

    public Product updateProduct(Long id, ProductRequest request) {
        Product product = getProductById(id);

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setSku(request.getSku());
        product.setCategory(request.getCategory());
        product.setUnitPrice(request.getUnitPrice());
        product.setCostPrice(request.getCostPrice());
        product.setReorderLevel(request.getReorderLevel());
        product.setImageUrl(request.getImageUrl());

        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        product.setIsActive(false);
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public List<Product> searchProducts(String query) {
        return productRepository.findByNameContainingIgnoreCase(query);
    }

    @Transactional(readOnly = true)
    public List<Product> getLowStockProducts() {
        List<Product> allProducts = productRepository.findByIsActiveTrue();
        List<Product> lowStockProducts = new ArrayList<>();

        for (Product product : allProducts) {
            Integer rawIn = inventoryRepository.findTotalInByProductId(product.getId());
            Integer rawOut = inventoryRepository.findTotalOutByProductId(product.getId());
            int stockIn = rawIn != null ? rawIn : 0;
            int stockOut = rawOut != null ? rawOut : 0;
            int stock = stockIn - stockOut;
            Integer reorderLevel = product.getReorderLevel();
            if (reorderLevel != null && stock < reorderLevel) {
                lowStockProducts.add(product);
            }
        }

        return lowStockProducts;
    }

    @Transactional(readOnly = true)
    public Product getProductBySku(String sku) {
        return productRepository.findBySku(sku)
                .orElseThrow(() -> new RuntimeException("Product not found with SKU: " + sku));
    }

    public Product toggleProductStatus(Long id) {
        Product product = getProductById(id);
        product.setIsActive(!Boolean.TRUE.equals(product.getIsActive()));
        return productRepository.save(product);
    }
}
