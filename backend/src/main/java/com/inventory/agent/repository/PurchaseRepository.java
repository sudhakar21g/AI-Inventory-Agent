package com.inventory.agent.repository;

import com.inventory.agent.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    List<Purchase> findByProductId(Long productId);

    List<Purchase> findBySupplierId(Long supplierId);

    List<Purchase> findByStatus(String status);

    List<Purchase> findByPurchaseDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.totalCost), 0) FROM Purchase p")
    BigDecimal findTotalPurchaseAmount();

    @Query("SELECT COALESCE(SUM(p.quantity), 0) FROM Purchase p")
    Long findTotalQuantityPurchased();
}
