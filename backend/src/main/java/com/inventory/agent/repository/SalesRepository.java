package com.inventory.agent.repository;

import com.inventory.agent.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SalesRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByProductId(Long productId);

    List<Sale> findBySaleDateBetween(LocalDateTime start, LocalDateTime end);

    List<Sale> findByStatus(String status);

    @Query("SELECT s.saleDate, SUM(s.totalPrice) FROM Sale s WHERE s.saleDate BETWEEN :start AND :end GROUP BY s.saleDate ORDER BY s.saleDate")
    List<Object[]> findTotalSalesByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT s.product, SUM(s.quantity) as totalQty FROM Sale s GROUP BY s.product ORDER BY totalQty DESC")
    List<Object[]> findTopSellingProducts();

    @Query("SELECT COALESCE(SUM(s.totalPrice), 0) FROM Sale s")
    BigDecimal findTotalSalesAmount();

    @Query("SELECT COALESCE(SUM(s.quantity), 0) FROM Sale s")
    Long findTotalQuantitySold();
}
