/* ============================================
   AgriCore — Login Page JS
   Uses Supabase Auth — no SMTP.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      loginError.textContent = 'Please fill in all fields.';
      loginError.style.display = 'block';
      return;
    }

    if (!AgriCore.isValidEmail(email)) {
      loginError.textContent = 'Please enter a valid email address.';
      loginError.style.display = 'block';
      return;
    }

    // Disable button during request
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
      const res = await AgriCore.apiPost('/auth/login', { email, password });

      if (res.success && res.data) {
        const user = res.data.user;
        user.token = res.data.token;
        AgriCore.setCurrentUser(user);

        // Check for pending verification notification
        if (user.verification_status === 'verified' && user.role === 'government') {
          AgriCore.showToast('✅ Your account has been verified. You now have access to the dashboard.', 'success');
        }

        AgriCore.showToast('Login successful! Redirecting...', 'success');

        setTimeout(() => {
          // Government users with pending verification go to pending page
          if (user.role === 'government' && user.verification_status !== 'verified') {
            window.location.href = '/pending-verification';
          } else if (user.role === 'admin') {
            window.location.href = '/platform/admin/console';
          } else {
            window.location.href = '/platform/dashboard';
          }
        }, 800);
      } else {
        loginError.textContent = res.error || res.message || 'Invalid email or password.';
        loginError.style.display = 'block';
      }
    } catch (err) {
      loginError.textContent = 'Network error. Please try again.';
      loginError.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });

  // --- Forgot Password Modal ---
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const forgotPasswordModal = document.getElementById('forgotPasswordModal');
  const closeForgotModal = document.getElementById('closeForgotModal');
  const cancelReset = document.getElementById('cancelReset');
  const sendResetBtn = document.getElementById('sendResetBtn');

  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotPasswordModal.classList.add('active');
  });

  closeForgotModal.addEventListener('click', () => {
    forgotPasswordModal.classList.remove('active');
  });

  cancelReset.addEventListener('click', () => {
    forgotPasswordModal.classList.remove('active');
  });

  forgotPasswordModal.addEventListener('click', (e) => {
    if (e.target === forgotPasswordModal) {
      forgotPasswordModal.classList.remove('active');
    }
  });

  sendResetBtn.addEventListener('click', () => {
    const resetEmail = document.getElementById('resetEmail').value.trim();
    if (!resetEmail || !AgriCore.isValidEmail(resetEmail)) {
      AgriCore.showToast('Please enter a valid email address.', 'error');
      return;
    }

    sendResetBtn.disabled = true;
    sendResetBtn.textContent = 'Sending...';

    AgriCore.apiPost('/auth/forgot-password', { email: resetEmail })
      .then(function (res) {
        if (res.success) {
          AgriCore.showToast('If that email exists, a reset link has been sent to your inbox.', 'success');
        } else {
          AgriCore.showToast('Something went wrong. Please try again.', 'error');
        }
      })
      .finally(function () {
        sendResetBtn.disabled = false;
        sendResetBtn.textContent = 'Send Reset Link';
        forgotPasswordModal.classList.remove('active');
      });
  });
});
