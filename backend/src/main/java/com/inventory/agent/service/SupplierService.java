package com.inventory.agent.service;

import com.inventory.agent.entity.Supplier;
import com.inventory.agent.repository.PurchaseRepository;
import com.inventory.agent.repository.SupplierRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final PurchaseRepository purchaseRepository;

    public SupplierService(SupplierRepository supplierRepository, PurchaseRepository purchaseRepository) {
        this.supplierRepository = supplierRepository;
        this.purchaseRepository = purchaseRepository;
    }

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    public Supplier createSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public Supplier updateSupplier(Long id, Supplier updated) {
        Supplier supplier = getSupplierById(id);
        supplier.setName(updated.getName());
        supplier.setContactPerson(updated.getContactPerson());
        supplier.setEmail(updated.getEmail());
        supplier.setPhone(updated.getPhone());
        supplier.setAddress(updated.getAddress());
        return supplierRepository.save(supplier);
    }

    public void deleteSupplier(Long id) {
        getSupplierById(id);
        List<?> purchases = purchaseRepository.findBySupplierId(id);
        if (!purchases.isEmpty()) {
            throw new RuntimeException("Cannot delete supplier: " + purchases.size() + " purchase(s) are linked to this supplier. Remove the purchases first.");
        }
        supplierRepository.deleteById(id);
    }

    public List<Supplier> searchSuppliers(String q) {
        return supplierRepository.findByNameContainingIgnoreCase(q);
    }
}
