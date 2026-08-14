var salesChart = null;
var purchaseChart = null;
var inventoryChart = null;

document.addEventListener('DOMContentLoaded', function () {
    if (!requireAuth()) return;
    initDates();
    generateReports();
});

function initDates() {
    var today = new Date();
    var thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    document.getElementById('startDate').value = thirtyDaysAgo.toISOString().split('T')[0];
}

async function generateReports() {
    var startDate = document.getElementById('startDate').value;
    var endDate = document.getElementById('endDate').value;

    await Promise.all([
        loadSalesReport(startDate, endDate),
        loadPurchaseReport(startDate, endDate),
        loadInventoryReport()
    ]);
}

async function loadSalesReport(start, end) {
    try {
        var data;
        if (start && end) {
            data = await apiRequest('/sales/date-range?start=' + start + '&end=' + end);
        } else {
            data = await apiRequest('/sales');
        }

        var sales = data || [];
        var totalSales = 0;
        var monthlyData = {};

        sales.forEach(function (sale) {
            totalSales += parseFloat(sale.totalPrice || ((sale.unitPrice || 0) * (sale.quantity || 0)) || 0);
            var dateKey = (sale.saleDate || sale.createdAt || '').substring(0, 7);
            if (dateKey) {
                monthlyData[dateKey] = (monthlyData[dateKey] || 0) + parseFloat(sale.totalPrice || ((sale.unitPrice || 0) * (sale.quantity || 0)) || 0);
            }
        });

        document.getElementById('reportTotalSales').textContent = formatCurrency(totalSales);
        document.getElementById('reportSaleCount').textContent = sales.length;

        var labels = Object.keys(monthlyData).sort();
        var values = labels.map(function (l) { return monthlyData[l]; });

        if (salesChart) salesChart.destroy();

        var ctx = document.getElementById('salesReportChart');
        salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [{
                    label: 'Sales ($)',
                    data: values.length ? values : [0],
                    backgroundColor: 'rgba(79, 70, 229, 0.7)',
                    borderColor: '#4f46e5',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    } catch (error) {
        console.error('Failed to load sales report:', error);
        showToast('Failed to load sales report', 'error');
    }
}

async function loadPurchaseReport(start, end) {
    try {
        var data;
        if (start && end) {
            data = await apiRequest('/purchases/date-range?start=' + start + '&end=' + end);
        } else {
            data = await apiRequest('/purchases');
        }

        var purchases = data || [];
        var totalPurchases = 0;
        var monthlyData = {};

        purchases.forEach(function (p) {
            totalPurchases += parseFloat(p.totalCost || ((p.unitCost || 0) * (p.quantity || 0)) || 0);
            var dateKey = (p.purchaseDate || p.createdAt || '').substring(0, 7);
            if (dateKey) {
                monthlyData[dateKey] = (monthlyData[dateKey] || 0) + parseFloat(p.totalCost || ((p.unitCost || 0) * (p.quantity || 0)) || 0);
            }
        });

        document.getElementById('reportTotalPurchases').textContent = formatCurrency(totalPurchases);
        document.getElementById('reportPurchaseCount').textContent = purchases.length;

        var labels = Object.keys(monthlyData).sort();
        var values = labels.map(function (l) { return monthlyData[l]; });

        if (purchaseChart) purchaseChart.destroy();

        var ctx = document.getElementById('purchaseReportChart');
        purchaseChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [{
                    label: 'Purchases ($)',
                    data: values.length ? values : [0],
                    backgroundColor: 'rgba(245, 158, 11, 0.7)',
                    borderColor: '#f59e0b',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    } catch (error) {
        console.error('Failed to load purchase report:', error);
        showToast('Failed to load purchase report', 'error');
    }
}

async function loadInventoryReport() {
    try {
        var products = await apiRequest('/products');
        var movements = await apiRequest('/inventory/movements');

        var productList = products || [];
        var movementList = movements || [];

        var stockIn = 0;
        var stockOut = 0;
        var lowStock = 0;

        movementList.forEach(function (m) {
            if (m.movementType === 'IN') stockIn += m.quantity || 0;
            else if (m.movementType === 'OUT') stockOut += m.quantity || 0;
        });

        productList.forEach(function (p) {
            if (p.reorderLevel && p.reorderLevel > 0) {
                var productMovements = movementList.filter(function (m) {
                    var mProdId = m.productId || (m.product && m.product.id);
                    return mProdId === p.id;
                });
                var currentStock = 0;
                productMovements.forEach(function (m) {
                    if (m.movementType === 'IN') currentStock += m.quantity || 0;
                    else if (m.movementType === 'OUT') currentStock -= m.quantity || 0;
                });
                if (currentStock <= p.reorderLevel) lowStock++;
            }
        });

        document.getElementById('reportTotalProducts').textContent = productList.length;
        document.getElementById('reportStockIn').textContent = stockIn;
        document.getElementById('reportStockOut').textContent = stockOut;
        document.getElementById('reportLowStock').textContent = lowStock;

        var categoryData = {};
        productList.forEach(function (p) {
            var cat = p.category || 'Uncategorized';
            categoryData[cat] = (categoryData[cat] || 0) + 1;
        });

        var labels = Object.keys(categoryData);
        var values = Object.values(categoryData);
        var colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

        if (inventoryChart) inventoryChart.destroy();

        var ctx = document.getElementById('inventoryReportChart');
        inventoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [{
                    data: values.length ? values : [1],
                    backgroundColor: colors.slice(0, labels.length || 1),
                    borderWidth: 2,
                    borderColor: '#ffffff'
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
                }
            }
        });
    } catch (error) {
        console.error('Failed to load inventory report:', error);
        showToast('Failed to load inventory report', 'error');
    }
}
