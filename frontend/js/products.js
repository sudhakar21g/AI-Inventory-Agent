let allProducts = [];

document.addEventListener('DOMContentLoaded', function () {
    if (!requireAuth()) return;
    loadProducts();
});

async function loadProducts() {
    try {
        const data = await apiRequest('/products');
        allProducts = data || [];
        renderProducts(allProducts);
        populateCategoryFilter();
    } catch (error) {
        console.error('Failed to load products:', error);
        showToast('Failed to load products', 'error');
    }
}

function populateCategoryFilter() {
    const select = document.getElementById('productCategoryFilter');
    if (!select) return;
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();
    select.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
}

function renderProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="bi bi-box" style="font-size: 48px; color: var(--gray-lighter);"></i><h3>No products found</h3><p>Add your first product to get started.</p></td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td><strong>${product.name || 'N/A'}</strong></td>
            <td><span class="badge badge-info">${product.sku || 'N/A'}</span></td>
            <td>${product.category || 'N/A'}</td>
            <td>${formatCurrency(product.unitPrice)}</td>
            <td>${product.reorderLevel || 0}</td>
            <td><span class="badge ${product.isActive !== false ? 'badge-success' : 'badge-danger'}">${product.isActive !== false ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm ${product.isActive !== false ? 'btn-success' : 'btn-outline'}" onclick="toggleProductStatus(${product.id}, ${product.isActive !== false})" title="${product.isActive !== false ? 'Deactivate' : 'Activate'}">
                        <i class="bi bi-${product.isActive !== false ? 'pause-circle' : 'play-circle'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="editProduct(${product.id})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id}, '${(product.name || '').replace(/'/g, "\\'")}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!query) {
        renderProducts(allProducts);
        return;
    }
    const filtered = allProducts.filter(p =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
    );
    renderProducts(filtered);
}

function applyProductFilters() {
    let filtered = [...allProducts];
    const category = document.getElementById('productCategoryFilter').value;
    const status = document.getElementById('productStatusFilter').value;
    const sort = document.getElementById('productSortFilter').value;

    if (category) filtered = filtered.filter(p => p.category === category);
    if (status === 'active') filtered = filtered.filter(p => p.isActive !== false);
    else if (status === 'inactive') filtered = filtered.filter(p => p.isActive === false);
    if (sort === 'name') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sort === 'price-asc') filtered.sort((a, b) => (a.unitPrice || 0) - (b.unitPrice || 0));
    else if (sort === 'price-desc') filtered.sort((a, b) => (b.unitPrice || 0) - (a.unitPrice || 0));

    renderProducts(filtered);
}

function clearProductFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('productCategoryFilter').value = '';
    document.getElementById('productStatusFilter').value = '';
    document.getElementById('productSortFilter').value = '';
    renderProducts(allProducts);
}

function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('productModalTitle').textContent = 'Add New Product';
}

function editProduct(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('editProductId').value = product.id;
    document.getElementById('productModalTitle').textContent = 'Edit Product';
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productSku').value = product.sku || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productReorderLevel').value = product.reorderLevel || '';
    document.getElementById('productUnitPrice').value = product.unitPrice || '';
    document.getElementById('productCostPrice').value = product.costPrice || '';

    openModal('addProductModal');
}

async function saveProduct(e) {
    e.preventDefault();

    const editId = document.getElementById('editProductId').value;
    const payload = {
        name: document.getElementById('productName').value.trim(),
        sku: document.getElementById('productSku').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        category: document.getElementById('productCategory').value.trim(),
        reorderLevel: parseInt(document.getElementById('productReorderLevel').value),
        unitPrice: parseFloat(document.getElementById('productUnitPrice').value),
        costPrice: parseFloat(document.getElementById('productCostPrice').value)
    };

    try {
        if (editId) {
            await apiRequest('/products/' + editId, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            showToast('Product updated successfully');
        } else {
            await apiRequest('/products', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showToast('Product created successfully');
        }

        closeModal('addProductModal');
        resetProductForm();
        loadProducts();
    } catch (error) {
        console.error('Failed to save product:', error);
        showToast('Failed to save product', 'error');
    }
}

async function deleteProduct(id, name) {
    if (!confirm('Are you sure you want to delete "' + name + '"?')) return;

    try {
        await apiRequest('/products/' + id, { method: 'DELETE' });
        showToast('Product deleted successfully');
        loadProducts();
    } catch (error) {
        console.error('Failed to delete product:', error);
        showToast('Failed to delete product', 'error');
    }
}

async function toggleProductStatus(id, currentlyActive) {
    try {
        await apiRequest('/products/' + id + '/toggle-status', { method: 'PATCH' });
        showToast(currentlyActive ? 'Product deactivated' : 'Product activated');
        loadProducts();
    } catch (error) {
        console.error('Failed to toggle status:', error);
        showToast('Failed to toggle status', 'error');
    }
}

document.getElementById('addProductModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal('addProductModal');
        resetProductForm();
    }
});
