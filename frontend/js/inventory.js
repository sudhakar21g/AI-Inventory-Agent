let allMovements = [];
let allProductsList = [];

document.addEventListener('DOMContentLoaded', function () {
    if (!requireAuth()) return;
    loadMovements();
    loadProductsForDropdown();
});

async function loadMovements() {
    try {
        const data = await apiRequest('/inventory/movements');
        allMovements = data || [];
        renderMovements(allMovements);
        updateMovementStats(allMovements);
    } catch (error) {
        console.error('Failed to load movements:', error);
        showToast('Failed to load movements', 'error');
    }
}

async function loadProductsForDropdown() {
    try {
        const data = await apiRequest('/products');
        allProductsList = data || [];
        const select = document.getElementById('movementProduct');
        select.innerHTML = '<option value="">Select a product</option>';
        allProductsList.forEach(product => {
            const opt = document.createElement('option');
            opt.value = product.id;
            opt.textContent = product.name + ' (SKU: ' + product.sku + ')';
            select.appendChild(opt);
        });

        const filterSelect = document.getElementById('movementProductFilter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Products</option>';
            allProductsList.forEach(product => {
                const opt = document.createElement('option');
                opt.value = product.id;
                opt.textContent = product.name;
                filterSelect.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function applyMovementFilters() {
    let filtered = [...allMovements];
    const type = document.getElementById('movementTypeFilter').value;
    const productId = document.getElementById('movementProductFilter').value;
    const from = document.getElementById('movementDateFrom').value;
    const to = document.getElementById('movementDateTo').value;

    if (type) filtered = filtered.filter(m => m.movementType === type);
    if (productId) filtered = filtered.filter(m => String(m.product?.id || m.productId) === productId);
    if (from) filtered = filtered.filter(m => (m.movementDate || m.createdAt || '').substring(0, 10) >= from);
    if (to) filtered = filtered.filter(m => (m.movementDate || m.createdAt || '').substring(0, 10) <= to);

    renderMovements(filtered);
    updateMovementStats(filtered);
}

function clearMovementFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('movementTypeFilter').value = '';
    document.getElementById('movementProductFilter').value = '';
    document.getElementById('movementDateFrom').value = '';
    document.getElementById('movementDateTo').value = '';
    renderMovements(allMovements);
    updateMovementStats(allMovements);
}

function renderMovements(movements) {
    const tbody = document.getElementById('movementsTableBody');
    if (!movements || movements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="bi bi-arrow-left-right" style="font-size: 48px; color: var(--gray-lighter);"></i><h3>No movements recorded</h3><p>Record your first inventory movement to get started.</p></td></tr>';
        return;
    }

    tbody.innerHTML = movements.map(m => `
        <tr>
            <td>${m.productName || m.product?.name || 'N/A'}</td>
            <td><span class="badge ${m.movementType === 'IN' ? 'badge-success' : m.movementType === 'OUT' ? 'badge-danger' : 'badge-warning'}">${m.movementType || 'N/A'}</span></td>
            <td>${m.quantity || 0}</td>
            <td>${m.referenceNumber || '-'}</td>
            <td>${formatDateTime(m.movementDate || m.createdAt)}</td>
            <td>${m.notes || '-'}</td>
        </tr>
    `).join('');
}

function updateMovementStats(movements) {
    let totalIn = 0, totalOut = 0, totalAdjustments = 0;
    movements.forEach(m => {
        if (m.movementType === 'IN') totalIn += m.quantity || 0;
        else if (m.movementType === 'OUT') totalOut += m.quantity || 0;
        else totalAdjustments += m.quantity || 0;
    });
    document.getElementById('totalIn').textContent = totalIn;
    document.getElementById('totalOut').textContent = totalOut;
    document.getElementById('totalMovements').textContent = movements.length;
    document.getElementById('totalAdjustments').textContent = totalAdjustments;
}

function searchMovements() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!query) {
        renderMovements(allMovements);
        return;
    }
    const filtered = allMovements.filter(m =>
        (m.productName && m.productName.toLowerCase().includes(query)) ||
        (m.movementType && m.movementType.toLowerCase().includes(query)) ||
        (m.referenceNumber && m.referenceNumber.toLowerCase().includes(query)) ||
        (m.notes && m.notes.toLowerCase().includes(query))
    );
    renderMovements(filtered);
}

async function saveMovement(e) {
    e.preventDefault();

    const payload = {
        productId: parseInt(document.getElementById('movementProduct').value),
        movementType: document.getElementById('movementType').value,
        quantity: parseInt(document.getElementById('movementQuantity').value),
        referenceNumber: document.getElementById('movementReference').value.trim(),
        notes: document.getElementById('movementNotes').value.trim()
    };

    try {
        await apiRequest('/inventory/movements', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast('Movement recorded successfully');
        closeModal('addMovementModal');
        document.getElementById('movementForm').reset();
        loadMovements();
    } catch (error) {
        console.error('Failed to record movement:', error);
        showToast('Failed to record movement', 'error');
    }
}

document.getElementById('addMovementModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal('addMovementModal');
        document.getElementById('movementForm').reset();
    }
});
