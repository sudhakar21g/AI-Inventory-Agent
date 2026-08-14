document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('token')) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Toggle password visibility
    document.querySelectorAll('[id="togglePassword"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var input = this.closest('.input-group').querySelector('input[type="password"], input[type="text"]');
            var icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('bi-eye', 'bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('bi-eye-slash', 'bi-eye');
            }
        });
    });

    // Login form
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            var errorDiv = document.getElementById('loginError');
            errorDiv.classList.add('d-none');

            var username = document.getElementById('username').value.trim();
            var password = document.getElementById('password').value;

            if (!username || !password) {
                showError(errorDiv, 'Please enter username and password.');
                return;
            }

            var btn = this.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Signing in...';

            try {
                var response = await fetch(CONFIG.API_BASE + '/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username, password: password })
                });

                if (!response.ok) {
                    var text = await response.text();
                    throw new Error(text || 'Invalid credentials');
                }

                var data = await response.json();
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify({
                    username: data.username,
                    email: data.email,
                    role: data.role,
                    fullName: data.fullName
                }));
                window.location.href = 'dashboard.html';
            } catch (error) {
                showError(errorDiv, error.message || 'Login failed.');
                btn.disabled = false;
                btn.innerHTML = 'Sign In';
            }
        });
    }

    // Register form
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            var errorDiv = document.getElementById('registerError');
            errorDiv.classList.add('d-none');

            var fullName = document.getElementById('fullName').value.trim();
            var username = document.getElementById('username').value.trim();
            var email = document.getElementById('email').value.trim();
            var password = document.getElementById('password').value;
            var confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                showError(errorDiv, 'Passwords do not match.');
                return;
            }
            if (password.length < 6) {
                showError(errorDiv, 'Password must be at least 6 characters.');
                return;
            }
            if (username.length < 3) {
                showError(errorDiv, 'Username must be at least 3 characters.');
                return;
            }

            var btn = this.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating Account...';

            try {
                var response = await fetch(CONFIG.API_BASE + '/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName: fullName, username: username, email: email, password: password })
                });

                if (!response.ok) {
                    var text = await response.text();
                    throw new Error(text || 'Registration failed');
                }

                var data = await response.json();
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify({
                    username: data.username,
                    email: data.email,
                    role: data.role,
                    fullName: data.fullName
                }));
                window.location.href = 'dashboard.html';
            } catch (error) {
                showError(errorDiv, error.message || 'Registration failed.');
                btn.disabled = false;
                btn.innerHTML = 'Register';
            }
        });
    }
});

function showError(div, msg) {
    div.textContent = msg;
    div.classList.remove('d-none');
}
