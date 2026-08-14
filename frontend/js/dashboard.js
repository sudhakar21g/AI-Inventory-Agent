document.addEventListener('DOMContentLoaded', function () {
    if (!requireAuth()) return;
    loadDashboardStats();
    loadRecentSales();
    loadRecentPurchases();
});

async function loadDashboardStats() {
    try {
        const data = await apiRequest('/dashboard/stats');
        if (data) {
            document.getElementById('totalProducts').textContent = data.totalProducts || 0;
            document.getElementById('totalSales').textContent = formatCurrency(data.totalSalesRevenue || 0);
            document.getElementById('totalSuppliers').textContent = data.totalSuppliers || 0;
            document.getElementById('lowStockAlerts').textContent = data.lowStockProducts || 0;

            if (data.salesTrend) {
                renderSalesTrendChart(data.salesTrend);
            }
            if (data.categoryDistribution) {
                renderCategoryChart(data.categoryDistribution);
            }
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

async function loadRecentSales() {
    try {
        const data = await apiRequest('/sales');
        const tbody = document.getElementById('recentSalesBody');
        if (data && data.length > 0) {
            const recent = data.slice(0, 5);
            tbody.innerHTML = recent.map(sale => `
                <tr>
                    <td>${sale.productName || sale.product?.name || 'N/A'}</td>
                    <td>${sale.customerName || 'N/A'}</td>
                    <td>${formatCurrency(sale.totalPrice || sale.unitPrice * sale.quantity)}</td>
                    <td>${formatDate(sale.saleDate || sale.createdAt)}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="bi bi-cart-check" style="font-size: 32px; color: var(--gray-lighter);"></i><p>No recent sales</p></td></tr>';
        }
    } catch (error) {
        console.error('Failed to load recent sales:', error);
    }
}

async function loadRecentPurchases() {
    try {
        const data = await apiRequest('/purchases');
        const tbody = document.getElementById('recentPurchasesBody');
        if (data && data.length > 0) {
            const recent = data.slice(0, 5);
            tbody.innerHTML = recent.map(purchase => `
                <tr>
                    <td>${purchase.productName || purchase.product?.name || 'N/A'}</td>
                    <td>${purchase.supplierName || purchase.supplier?.name || 'N/A'}</td>
                    <td>${formatCurrency(purchase.totalCost || purchase.unitCost * purchase.quantity)}</td>
                    <td>${formatDate(purchase.purchaseDate || purchase.createdAt)}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="bi bi-bag" style="font-size: 32px; color: var(--gray-lighter);"></i><p>No recent purchases</p></td></tr>';
        }
    } catch (error) {
        console.error('Failed to load recent purchases:', error);
    }
}

function renderSalesTrendChart(data) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.label || d.date || d.month),
            datasets: [{
                label: 'Sales',
                data: data.map(d => d.value || d.amount || d.revenue),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#4f46e5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.label || d.category),
            datasets: [{
                data: data.map(d => d.value || d.count),
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { padding: 12, usePointStyle: true }
                }
            },
            cutout: '65%'
        }
    });
}
