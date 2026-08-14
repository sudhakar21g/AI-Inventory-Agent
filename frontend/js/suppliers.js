let allSuppliers = [];

document.addEventListener('DOMContentLoaded', function () {
    if (!requireAuth()) return;
    loadSuppliers();
});

async function loadSuppliers() {
    try {
        allSuppliers = await apiRequest('/suppliers') || [];
    } catch (error) {
        allSuppliers = [];
    }
    renderSuppliers(allSuppliers);
}

function renderSuppliers(suppliers) {
    const tbody = document.getElementById('suppliersTableBody');
    if (!suppliers || suppliers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="bi bi-truck" style="font-size: 48px; color: var(--gray-lighter);"></i><h3>No suppliers found</h3><p>Add your first supplier to get started.</p></td></tr>';
        return;
    }

    tbody.innerHTML = suppliers.map(supplier => `
        <tr>
            <td><strong>${supplier.name || 'N/A'}</strong></td>
            <td>${supplier.contactPerson || '-'}</td>
            <td>${supplier.email || '-'}</td>
            <td>${supplier.phone || '-'}</td>
            <td>${supplier.address || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline" onclick="editSupplier(${supplier.id})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSupplier(${supplier.id}, '${(supplier.name || '').replace(/'/g, "\\'")}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function searchSuppliers() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!query) {
        renderSuppliers(allSuppliers);
        return;
    }
    const filtered = allSuppliers.filter(s =>
        (s.name && s.name.toLowerCase().includes(query)) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(query)) ||
        (s.email && s.email.toLowerCase().includes(query))
    );
    renderSuppliers(filtered);
}

function applySupplierFilters() {
    let filtered = [...allSuppliers];
    const hasEmail = document.getElementById('supplierEmailFilter').value;
    const hasPhone = document.getElementById('supplierPhoneFilter').value;
    const sort = document.getElementById('supplierSortFilter').value;

    if (hasEmail === 'yes') filtered = filtered.filter(s => s.email);
    else if (hasEmail === 'no') filtered = filtered.filter(s => !s.email);
    if (hasPhone === 'yes') filtered = filtered.filter(s => s.phone);
    else if (hasPhone === 'no') filtered = filtered.filter(s => !s.phone);
    if (sort === 'name') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    renderSuppliers(filtered);
}

function clearSupplierFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('supplierEmailFilter').value = '';
    document.getElementById('supplierPhoneFilter').value = '';
    document.getElementById('supplierSortFilter').value = '';
    renderSuppliers(allSuppliers);
}

function resetSupplierForm() {
    document.getElementById('supplierForm').reset();
    document.getElementById('editSupplierId').value = '';
    document.getElementById('supplierModalTitle').textContent = 'Add New Supplier';
}

function editSupplier(id) {
    const supplier = allSuppliers.find(s => s.id === id);
    if (!supplier) return;

    document.getElementById('editSupplierId').value = supplier.id;
    document.getElementById('supplierModalTitle').textContent = 'Edit Supplier';
    document.getElementById('supplierName').value = supplier.name || '';
    document.getElementById('supplierContact').value = supplier.contactPerson || '';
    document.getElementById('supplierEmail').value = supplier.email || '';
    document.getElementById('supplierPhone').value = supplier.phone || '';
    document.getElementById('supplierAddress').value = supplier.address || '';

    openModal('addSupplierModal');
}

async function saveSupplier(e) {
    e.preventDefault();

    const editId = document.getElementById('editSupplierId').value;
    const payload = {
        name: document.getElementById('supplierName').value.trim(),
        contactPerson: document.getElementById('supplierContact').value.trim(),
        email: document.getElementById('supplierEmail').value.trim(),
        phone: document.getElementById('supplierPhone').value.trim(),
        address: document.getElementById('supplierAddress').value.trim()
    };

    try {
        const url = editId ? '/suppliers/' + editId : '/suppliers';
        const method = editId ? 'PUT' : 'POST';
        await apiRequest(url, {
            method: method,
            body: JSON.stringify(payload)
        });

        showToast(editId ? 'Supplier updated successfully' : 'Supplier created successfully');
        closeModal('addSupplierModal');
        resetSupplierForm();
        loadSuppliers();
    } catch (error) {
        console.error('Failed to save supplier:', error);
        showToast(error.message || 'Failed to save supplier', 'error');
    }
}

async function deleteSupplier(id, name) {
    if (!confirm('Are you sure you want to delete "' + name + '"?')) return;

    try {
        await apiRequest('/suppliers/' + id, {
            method: 'DELETE'
        });

        showToast('Supplier deleted successfully');
        loadSuppliers();
    } catch (error) {
        console.error('Failed to delete supplier:', error);
        showToast('Failed to delete supplier', 'error');
    }
}

document.getElementById('addSupplierModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal('addSupplierModal');
        resetSupplierForm();
    }
});
