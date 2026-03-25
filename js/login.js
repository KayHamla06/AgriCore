/* ============================================
   AgriCore — Login Page JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  loginForm.addEventListener('submit', (e) => {
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

    const user = AgriCore.authenticateUser(email, password);
    if (user) {
      AgriCore.setCurrentUser(user);
      AgriCore.showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
      }, 800);
    } else {
      loginError.textContent = 'Invalid email or password. Try farmer@agricore.com / farmer123 or gov@gov.za / gov123';
      loginError.style.display = 'block';
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
          AgriCore.showToast('If that email exists, a reset link has been sent.', 'success');
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
