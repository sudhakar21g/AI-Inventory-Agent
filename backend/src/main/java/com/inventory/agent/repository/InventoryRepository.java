package com.inventory.agent.repository;

import com.inventory.agent.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<InventoryMovement, Long> {

    List<InventoryMovement> findByProductId(Long productId);

    List<InventoryMovement> findByMovementType(String movementType);

    List<InventoryMovement> findByMovementDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(im.quantity), 0) FROM InventoryMovement im WHERE im.product.id = :productId AND im.movementType = 'IN'")
    Integer findTotalInByProductId(@Param("productId") Long productId);

    @Query("SELECT COALESCE(SUM(im.quantity), 0) FROM InventoryMovement im WHERE im.product.id = :productId AND im.movementType = 'OUT'")
    Integer findTotalOutByProductId(@Param("productId") Long productId);
}
