document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  var form = document.getElementById('resetPasswordForm');
  var errorEl = document.getElementById('resetError');
  var subtitleEl = document.getElementById('resetSubtitle');
  var accessToken = sessionStorage.getItem('agricore_reset_token');

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }

  if (!accessToken) {
    if (form) form.style.display = 'none';
    if (subtitleEl) {
      subtitleEl.textContent = 'Your reset session is missing or expired. Please request a new password reset link.';
    }
    AgriCore.showToast('Reset link expired. Please request a new one.', 'error');
    return;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearError();

    var newPassword = document.getElementById('newPassword').value;
    var confirmPassword = document.getElementById('confirmPassword').value;
    var submitBtn = form.querySelector('button[type="submit"]');

    if (!newPassword || newPassword.length < 8) {
      showError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Resetting...';

    try {
      var res = await AgriCore.apiPost('/auth/reset-password', {
        accessToken: accessToken,
        newPassword: newPassword,
      });

      if (!res.success) {
        showError(res.error || res.message || 'Unable to reset your password.');
        return;
      }

      sessionStorage.removeItem('agricore_reset_token');
      AgriCore.showToast('Password reset successful. Please sign in.', 'success');
      window.setTimeout(function () {
        window.location.href = '/auth/login';
      }, 1200);
    } catch (_error) {
      showError('Network error while resetting your password.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Reset Password';
    }
  });
});
