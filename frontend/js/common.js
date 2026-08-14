function getToken() {
    return sessionStorage.getItem('token');
}

function getUser() {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function setAuth(token, user) {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
}

function logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
}

function requireAuth() {
    if (!getToken()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    return fetch(CONFIG.API_BASE + endpoint, {
        ...options,
        headers
    }).then(async (response) => {
        if (response.status === 401) {
            logout();
            return;
        }
        const text = await response.text();
        if (!response.ok) {
            let msg = text;
            try {
                const parsed = JSON.parse(text);
                msg = parsed.message || parsed.error || text;
            } catch (e) {}
            throw new Error(msg || 'Request failed with status ' + response.status);
        }
        if (text) {
            try {
                return JSON.parse(text);
            } catch (e) {
                return text;
            }
        }
        return null;
    });
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatCurrency(amount) {
    if (amount == null) return '$0.00';
    return '$' + parseFloat(amount).toFixed(2);
}

function showToast(message, type) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'success');
    toast.innerHTML = '<span>' + message + '</span><button onclick="this.parentElement.remove()">&times;</button>';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
    let overlay = document.getElementById('sidebarOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'sidebar-overlay';
        overlay.onclick = function () {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        };
        document.body.appendChild(overlay);
    }
    overlay.classList.toggle('active');
}

function toggleFilter(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.toggle('active');
}

function initSidebar() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.parentElement.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.parentElement.classList.add('active');
        }
    });
    const user = getUser();
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay && user) {
        userDisplay.textContent = user.fullName || user.username || 'User';
    }
    const nameEl = document.querySelector('.sidebar-user-name');
    if (nameEl && user) {
        nameEl.textContent = user.fullName || user.username || 'User';
    }
    const roleEl = document.querySelector('.sidebar-user-role');
    if (roleEl && user) {
        roleEl.textContent = user.role || 'User';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    initSidebar();
});
