document.addEventListener('DOMContentLoaded', function () {
    if (!requireAuth()) return;
    loadProfile();
});

async function loadProfile() {
    try {
        const username = await apiRequest('/auth/me');
        const user = getUser();

        const profileInfo = document.getElementById('profileInfo');
        profileInfo.innerHTML = `
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                <div style="width: 64px; height: 64px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; font-weight: 600;">
                    ${(user.fullName || username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 style="font-size: 20px; font-weight: 600;">${user.fullName || username || 'User'}</h3>
                    <p style="color: var(--gray); font-size: 14px;">${user.email || ''}</p>
                </div>
            </div>
            <div style="display: grid; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--light); border-radius: var(--radius);">
                    <i class="bi bi-person" style="color: var(--gray); width: 20px;"></i>
                    <div>
                        <p style="font-size: 12px; color: var(--gray);">Username</p>
                        <p style="font-weight: 500;">${user.username || username || 'N/A'}</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--light); border-radius: var(--radius);">
                    <i class="bi bi-envelope" style="color: var(--gray); width: 20px;"></i>
                    <div>
                        <p style="font-size: 12px; color: var(--gray);">Email</p>
                        <p style="font-weight: 500;">${user.email || 'N/A'}</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--light); border-radius: var(--radius);">
                    <i class="bi bi-shield-check" style="color: var(--gray); width: 20px;"></i>
                    <div>
                        <p style="font-size: 12px; color: var(--gray);">Role</p>
                        <p style="font-weight: 500;"><span class="badge badge-primary">${user.role || 'USER'}</span></p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('editFullName').value = user.fullName || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editUsername').value = user.username || username || '';
    } catch (error) {
        console.error('Failed to load profile:', error);
        document.getElementById('profileInfo').innerHTML = '<p style="color: var(--danger);">Failed to load profile information.</p>';
    }
}

async function updateProfile(e) {
    e.preventDefault();

    const user = getUser();
    const payload = {
        fullName: document.getElementById('editFullName').value.trim(),
        email: document.getElementById('editEmail').value.trim(),
        username: user.username
    };

    try {
        await apiRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        const updatedUser = { ...user, fullName: payload.fullName, email: payload.email };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        showToast('Profile updated successfully');
        loadProfile();
    } catch (error) {
        console.error('Failed to update profile:', error);
        showToast(error.message || 'Failed to update profile', 'error');
    }
}

async function changePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('New password must be at least 6 characters', 'error');
        return;
    }

    try {
        await apiRequest('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        showToast('Password changed successfully');
        document.getElementById('changePasswordForm').reset();
    } catch (error) {
        console.error('Failed to change password:', error);
        showToast(error.message || 'Failed to change password', 'error');
    }
}
