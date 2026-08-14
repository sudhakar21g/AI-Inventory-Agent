package com.inventory.agent.repository;

import com.inventory.agent.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    List<Product> findByCategory(String category);

    List<Product> findByIsActiveTrue();

    @Query("SELECT p FROM Product p WHERE p.reorderLevel > 0")
    List<Product> findByReorderLevelLessThan(@Param("reorderLevel") Integer reorderLevel);

    List<Product> findByNameContainingIgnoreCase(String name);
}
