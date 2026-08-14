let allSales = [];
let saleProductsList = [];

document.addEventListener('DOMContentLoaded', function () {
    if (!requireAuth()) return;
    loadSales();
    loadProductsForSale();
});

async function loadProductsForSale() {
    try {
        const data = await apiRequest('/products');
        saleProductsList = data || [];
        const select = document.getElementById('saleProduct');
        select.innerHTML = '<option value="">Select a product</option>';
        saleProductsList.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name + ' ($' + parseFloat(p.unitPrice).toFixed(2) + ')';
            opt.dataset.price = p.unitPrice;
            select.appendChild(opt);
        });

        const filterSelect = document.getElementById('saleProductFilter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Products</option>';
            saleProductsList.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name;
                filterSelect.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function updateSalePrice() {
    const select = document.getElementById('saleProduct');
    const option = select.options[select.selectedIndex];
    if (option && option.dataset.price) {
        document.getElementById('saleUnitPrice').value = parseFloat(option.dataset.price).toFixed(2);
        calculateSaleTotal();
    }
}

function calculateSaleTotal() {
    const qty = parseInt(document.getElementById('saleQuantity').value) || 0;
    const price = parseFloat(document.getElementById('saleUnitPrice').value) || 0;
    const total = qty * price;
    document.getElementById('saleTotal').value = '$' + total.toFixed(2);
}

async function loadSales() {
    try {
        const data = await apiRequest('/sales');
        allSales = data || [];
        renderSales(allSales);
        updateSaleStats(allSales);
    } catch (error) {
        console.error('Failed to load sales:', error);
        showToast('Failed to load sales', 'error');
    }
}

function renderSales(sales) {
    const tbody = document.getElementById('salesTableBody');
    if (!sales || sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="bi bi-cart-check" style="font-size: 48px; color: var(--gray-lighter);"></i><h3>No sales found</h3><p>Record your first sale to get started.</p></td></tr>';
        return;
    }

    tbody.innerHTML = sales.map(sale => {
        const statusBadge = sale.status === 'COMPLETED' ? 'badge-success' :
            sale.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning';
        return `
            <tr>
                <td>${sale.productName || sale.product?.name || 'N/A'}</td>
                <td>${sale.customerName || 'N/A'}</td>
                <td>${sale.quantity || 0}</td>
                <td>${formatCurrency(sale.unitPrice)}</td>
                <td>${formatCurrency(sale.totalPrice || sale.unitPrice * sale.quantity)}</td>
                <td>${formatDate(sale.saleDate || sale.createdAt)}</td>
                <td><span class="badge ${statusBadge}">${sale.status || 'N/A'}</span></td>
            </tr>
        `;
    }).join('');
}

function updateSaleStats(sales) {
    let totalRevenue = 0, pending = 0, todayCount = 0;
    const today = new Date().toISOString().split('T')[0];

    sales.forEach(s => {
        totalRevenue += parseFloat(s.totalPrice || s.unitPrice * s.quantity || 0);
        if (s.status === 'PENDING') pending++;
        const saleDate = (s.saleDate || s.createdAt || '').split('T')[0];
        if (saleDate === today) todayCount++;
    });

    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('totalSaleCount').textContent = sales.length;
    document.getElementById('todaySales').textContent = todayCount;
    document.getElementById('pendingSales').textContent = pending;
}

function filterSalesByDate() {
    const from = document.getElementById('saleDateFrom').value;
    const to = document.getElementById('saleDateTo').value;
    if (!from && !to) {
        renderSales(allSales);
        return;
    }

    if (from && to) {
        const filtered = allSales.filter(s => {
            const d = (s.saleDate || s.createdAt || '').substring(0, 10);
            return d >= from && d <= to;
        });
        renderSales(filtered);
        updateSaleStats(filtered);
    } else if (from) {
        const filtered = allSales.filter(s => (s.saleDate || s.createdAt || '').substring(0, 10) >= from);
        renderSales(filtered);
        updateSaleStats(filtered);
    } else if (to) {
        const filtered = allSales.filter(s => (s.saleDate || s.createdAt || '').substring(0, 10) <= to);
        renderSales(filtered);
        updateSaleStats(filtered);
    }
}

function filterSales() {
    let filtered = [...allSales];
    const from = document.getElementById('saleDateFrom').value;
    const to = document.getElementById('saleDateTo').value;
    const customer = document.getElementById('saleCustomerFilter').value.toLowerCase().trim();
    const productId = document.getElementById('saleProductFilter').value;
    const status = document.getElementById('saleStatusFilter').value;

    if (from) filtered = filtered.filter(s => (s.saleDate || s.createdAt || '').substring(0, 10) >= from);
    if (to) filtered = filtered.filter(s => (s.saleDate || s.createdAt || '').substring(0, 10) <= to);
    if (customer) filtered = filtered.filter(s => (s.customerName || '').toLowerCase().includes(customer));
    if (productId) filtered = filtered.filter(s => String(s.productId || s.product?.id) === productId);
    if (status) filtered = filtered.filter(s => s.status === status);

    renderSales(filtered);
    updateSaleStats(filtered);
}

function clearSalesFilter() {
    document.getElementById('saleDateFrom').value = '';
    document.getElementById('saleDateTo').value = '';
    document.getElementById('saleCustomerFilter').value = '';
    document.getElementById('saleProductFilter').value = '';
    document.getElementById('saleStatusFilter').value = '';
    document.getElementById('searchInput').value = '';
    renderSales(allSales);
    updateSaleStats(allSales);
}

function searchSales() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!query) {
        renderSales(allSales);
        return;
    }
    const filtered = allSales.filter(s =>
        (s.customerName && s.customerName.toLowerCase().includes(query)) ||
        (s.productName && s.productName.toLowerCase().includes(query)) ||
        (s.product?.name && s.product.name.toLowerCase().includes(query)) ||
        (s.status && s.status.toLowerCase().includes(query))
    );
    renderSales(filtered);
    updateSaleStats(filtered);
}

async function saveSale(e) {
    e.preventDefault();

    const payload = {
        productId: parseInt(document.getElementById('saleProduct').value),
        customerName: document.getElementById('saleCustomer').value.trim(),
        quantity: parseInt(document.getElementById('saleQuantity').value),
        unitPrice: parseFloat(document.getElementById('saleUnitPrice').value)
    };

    try {
        await apiRequest('/sales', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast('Sale recorded successfully');
        closeModal('addSaleModal');
        document.getElementById('saleForm').reset();
        document.getElementById('saleTotal').value = '$0.00';
        loadSales();
    } catch (error) {
        console.error('Failed to record sale:', error);
        showToast('Failed to record sale', 'error');
    }
}

document.getElementById('addSaleModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal('addSaleModal');
        document.getElementById('saleForm').reset();
        document.getElementById('saleTotal').value = '$0.00';
    }
});
