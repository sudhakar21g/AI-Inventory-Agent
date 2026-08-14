let allPurchases = [];
let productsList = [];
let suppliersList = [];

document.addEventListener('DOMContentLoaded', function () {
    if (!requireAuth()) return;
    loadPurchases();
    loadProductsAndSuppliers();
});

async function loadProductsAndSuppliers() {
    try {
        const [products, suppliers] = await Promise.all([
            apiRequest('/products'),
            apiRequest('/suppliers')
        ]);

        productsList = products || [];
        suppliersList = suppliers || [];

        const prodSelect = document.getElementById('purchaseProduct');
        prodSelect.innerHTML = '<option value="">Select a product</option>';
        productsList.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name + ' (SKU: ' + p.sku + ')';
            prodSelect.appendChild(opt);
        });

        const suppSelect = document.getElementById('purchaseSupplier');
        suppSelect.innerHTML = '<option value="">Select a supplier</option>';
        suppliersList.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            suppSelect.appendChild(opt);
        });

        const filterSuppSelect = document.getElementById('purchaseSupplierFilter');
        if (filterSuppSelect) {
            filterSuppSelect.innerHTML = '<option value="">All Suppliers</option>';
            suppliersList.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.name;
                filterSuppSelect.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Failed to load products/suppliers:', error);
    }
}

function searchPurchases() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!query) {
        renderPurchases(allPurchases);
        return;
    }
    const filtered = allPurchases.filter(p =>
        (p.productName && p.productName.toLowerCase().includes(query)) ||
        (p.product?.name && p.product.name.toLowerCase().includes(query)) ||
        (p.supplierName && p.supplierName.toLowerCase().includes(query)) ||
        (p.supplier?.name && p.supplier.name.toLowerCase().includes(query)) ||
        (p.status && p.status.toLowerCase().includes(query))
    );
    renderPurchases(filtered);
    updatePurchaseStats(filtered);
}

function applyPurchaseFilters() {
    let filtered = [...allPurchases];
    const supplierId = document.getElementById('purchaseSupplierFilter').value;
    const status = document.getElementById('purchaseStatusFilter').value;
    const from = document.getElementById('purchaseDateFrom').value;
    const to = document.getElementById('purchaseDateTo').value;

    if (supplierId) filtered = filtered.filter(p => String(p.supplier?.id || p.supplierId) === supplierId);
    if (status) filtered = filtered.filter(p => p.status === status);
    if (from) filtered = filtered.filter(p => (p.purchaseDate || p.createdAt || '').substring(0, 10) >= from);
    if (to) filtered = filtered.filter(p => (p.purchaseDate || p.createdAt || '').substring(0, 10) <= to);

    renderPurchases(filtered);
    updatePurchaseStats(filtered);
}

function clearPurchaseFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('purchaseSupplierFilter').value = '';
    document.getElementById('purchaseStatusFilter').value = '';
    document.getElementById('purchaseDateFrom').value = '';
    document.getElementById('purchaseDateTo').value = '';
    renderPurchases(allPurchases);
    updatePurchaseStats(allPurchases);
}

async function loadPurchases() {
    try {
        const data = await apiRequest('/purchases');
        allPurchases = data || [];
        renderPurchases(allPurchases);
        updatePurchaseStats(allPurchases);
    } catch (error) {
        console.error('Failed to load purchases:', error);
        showToast('Failed to load purchases', 'error');
    }
}

function renderPurchases(purchases) {
    const tbody = document.getElementById('purchasesTableBody');
    if (!purchases || purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="bi bi-bag" style="font-size: 48px; color: var(--gray-lighter);"></i><h3>No purchases found</h3><p>Create your first purchase order to get started.</p></td></tr>';
        return;
    }

    tbody.innerHTML = purchases.map(purchase => {
        const statusBadge = purchase.status === 'RECEIVED' ? 'badge-success' :
            purchase.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning';
        return `
            <tr>
                <td>${purchase.productName || purchase.product?.name || 'N/A'}</td>
                <td>${purchase.supplierName || purchase.supplier?.name || 'N/A'}</td>
                <td>${purchase.quantity || 0}</td>
                <td>${formatCurrency(purchase.unitCost)}</td>
                <td>${formatCurrency(purchase.totalCost || purchase.unitCost * purchase.quantity)}</td>
                <td>${formatDate(purchase.purchaseDate || purchase.createdAt)}</td>
                <td><span class="badge ${statusBadge}">${purchase.status || 'N/A'}</span></td>
                <td>
                    <div class="action-buttons">
                        ${purchase.status === 'ORDERED' ? `
                            <button class="btn btn-sm btn-success" onclick="updateStatus(${purchase.id}, 'RECEIVED')" title="Mark Received">
                                <i class="bi bi-check-lg"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="updateStatus(${purchase.id}, 'CANCELLED')" title="Cancel">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        ` : ''}
                        ${purchase.status === 'RECEIVED' ? `
                            <button class="btn btn-sm btn-outline" onclick="updateStatus(${purchase.id}, 'ORDERED')" title="Reopen">
                                <i class="bi bi-arrow-counterclockwise"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updatePurchaseStats(purchases) {
    let totalSpend = 0, ordered = 0, received = 0;
    purchases.forEach(p => {
        totalSpend += parseFloat(p.totalCost || p.unitCost * p.quantity || 0);
        if (p.status === 'ORDERED') ordered++;
        else if (p.status === 'RECEIVED') received++;
    });
    document.getElementById('totalPurchases').textContent = purchases.length;
    document.getElementById('totalSpend').textContent = formatCurrency(totalSpend);
    document.getElementById('orderedCount').textContent = ordered;
    document.getElementById('receivedCount').textContent = received;
}

async function savePurchase(e) {
    e.preventDefault();

    const payload = {
        productId: parseInt(document.getElementById('purchaseProduct').value),
        supplierId: parseInt(document.getElementById('purchaseSupplier').value),
        quantity: parseInt(document.getElementById('purchaseQuantity').value),
        unitCost: parseFloat(document.getElementById('purchaseUnitCost').value)
    };

    try {
        await apiRequest('/purchases', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast('Purchase created successfully');
        closeModal('addPurchaseModal');
        document.getElementById('purchaseForm').reset();
        loadPurchases();
    } catch (error) {
        console.error('Failed to create purchase:', error);
        showToast('Failed to create purchase', 'error');
    }
}

async function updateStatus(id, status) {
    if (!confirm('Update purchase status to "' + status + '"?')) return;

    try {
        await apiRequest('/purchases/' + id + '/status?status=' + status, {
            method: 'PUT'
        });
        showToast('Status updated to ' + status);
        loadPurchases();
    } catch (error) {
        console.error('Failed to update status:', error);
        showToast('Failed to update status', 'error');
    }
}

document.getElementById('addPurchaseModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal('addPurchaseModal');
        document.getElementById('purchaseForm').reset();
    }
});
