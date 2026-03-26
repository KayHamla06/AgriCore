/* ============================================
   AgriCore — Signup Page JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  let currentStep = 1;
  let emailVerified = false;

  // --- Role Card Selection ---
  const roleCards = document.querySelectorAll('.role-card');
  const roleInput = document.getElementById('roleSelect');

  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      roleCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      roleInput.value = card.dataset.role;
    });
  });

  // --- Step Navigation ---
  function goToStep(step) {
    if (step > currentStep && !validateStep(currentStep)) return;

    if (step === 2) {
      // Pre-fill the email display from Step 1
      document.getElementById('verifyEmailDisplay').value = document.getElementById('signupEmail').value.trim();
    }

    if (step === 3) {
      const role = roleInput.value;
      document.getElementById('farmerForm').classList.toggle('active', role === 'farmer');
      document.getElementById('govForm').classList.toggle('active', role === 'government');
      lucide.createIcons();
    }

    if (step === 4) {
      buildReview();
    }

    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('step' + step).classList.add('active');

    // Update dots & lines
    for (let i = 1; i <= 4; i++) {
      const dot = document.getElementById('stepDot' + i);
      dot.classList.remove('active', 'completed');
      if (i < step) dot.classList.add('completed');
      else if (i === step) dot.classList.add('active');
    }
    for (let i = 1; i <= 3; i++) {
      document.getElementById('stepLine' + i).classList.toggle('filled', i < step);
    }

    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Wire navigation buttons
  document.getElementById('step1Next').addEventListener('click', () => goToStep(2));
  document.getElementById('step2Back').addEventListener('click', () => goToStep(1));
  document.getElementById('step2Next').addEventListener('click', () => goToStep(3));
  document.getElementById('step3Back').addEventListener('click', () => goToStep(2));
  document.getElementById('step3Next').addEventListener('click', () => goToStep(4));
  document.getElementById('step4Back').addEventListener('click', () => goToStep(3));

  // --- Validation ---
  function validateStep(step) {
    if (step === 1) {
      const name = document.getElementById('fullName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const role = roleInput.value;

      if (!name) { AgriCore.showToast('Please enter your full name.', 'error'); return false; }
      if (!email || !AgriCore.isValidEmail(email)) { AgriCore.showToast('Please enter a valid email.', 'error'); return false; }
      if (password.length < 8) { AgriCore.showToast('Password must be at least 8 characters.', 'error'); return false; }
      if (!role) { AgriCore.showToast('Please select your role.', 'error'); return false; }
      return true;
    }

    if (step === 2) {
      if (!emailVerified) { AgriCore.showToast('Please verify your email address.', 'error'); return false; }
      return true;
    }

    if (step === 3) {
      const role = roleInput.value;
      if (role === 'farmer') {
        if (!document.getElementById('farmName').value.trim()) { AgriCore.showToast('Please enter your farm name.', 'error'); return false; }
        if (!document.getElementById('farmProvince').value) { AgriCore.showToast('Please select a province.', 'error'); return false; }
      }
      if (role === 'government') {
        if (!document.getElementById('deptName').value.trim()) { AgriCore.showToast('Please enter your department name.', 'error'); return false; }
        if (!document.getElementById('employeeId').value.trim()) { AgriCore.showToast('Please enter your employee ID.', 'error'); return false; }
      }
      return true;
    }

    return true;
  }

  // --- Build Review ---
  function buildReview() {
    const role = roleInput.value;
    const esc = AgriCore.escapeHtml;

    let html = `
      <div class="review-section">
        <div class="review-section-title"><i data-lucide="user"></i> Basic Information</div>
        <div class="review-grid">
          <div class="review-item"><label>Full Name</label><span>${esc(document.getElementById('fullName').value)}</span></div>
          <div class="review-item"><label>Email</label><span>${esc(document.getElementById('signupEmail').value)}</span></div>
          <div class="review-item"><label>Role</label><span>${role === 'farmer' ? 'Farmer' : 'Government Official'}</span></div>
        </div>
      </div>`;

    if (role === 'farmer') {
      html += `
      <div class="review-section">
        <div class="review-section-title"><i data-lucide="tractor"></i> Farm Details</div>
        <div class="review-grid">
          <div class="review-item"><label>Farm Name</label><span>${esc(document.getElementById('farmName').value)}</span></div>
          <div class="review-item"><label>Province</label><span>${esc(document.getElementById('farmProvince').value)}</span></div>
          <div class="review-item"><label>District</label><span>${esc(document.getElementById('farmDistrict').value)}</span></div>
          <div class="review-item"><label>Farm Size</label><span>${esc(document.getElementById('farmSize').value)} ha</span></div>
          <div class="review-item"><label>Farmer Type</label><span>${esc(document.getElementById('farmerType').value)}</span></div>
          <div class="review-item"><label>Main Activity</label><span>${esc(document.getElementById('mainActivity').value)}</span></div>
        </div>
      </div>`;
    } else {
      html += `
      <div class="review-section">
        <div class="review-section-title"><i data-lucide="landmark"></i> Official Details</div>
        <div class="review-grid">
          <div class="review-item"><label>Department</label><span>${esc(document.getElementById('deptName').value)}</span></div>
          <div class="review-item"><label>Employee ID</label><span>${esc(document.getElementById('employeeId').value)}</span></div>
          <div class="review-item"><label>Work Email</label><span>${esc(document.getElementById('workEmail').value)}</span></div>
          <div class="review-item"><label>Province</label><span>${esc(document.getElementById('govProvince').value)}</span></div>
          <div class="review-item"><label>Position</label><span>${esc(document.getElementById('govPosition').value)}</span></div>
        </div>
      </div>`;
    }

    document.getElementById('reviewContent').innerHTML = html;
    lucide.createIcons();
  }

  // --- Email Verification via Resend ---
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const otpSection = document.getElementById('otpSection');
  const sendOtpBtnContainer = document.getElementById('sendOtpBtnContainer');

  sendOtpBtn.addEventListener('click', async () => {
    const email = document.getElementById('signupEmail').value.trim();
    if (!email) {
      AgriCore.showToast('No email address found. Please go back to Step 1.', 'error');
      return;
    }

    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Sending...';

    try {
      const res = await fetch(AgriCore.API_URL + '/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        AgriCore.showToast(data.message || 'Failed to send code.', 'error');
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send Verification Code';
        return;
      }

      sendOtpBtnContainer.style.display = 'none';
      otpSection.style.display = 'block';
      AgriCore.showToast('Verification code sent to your email!', 'success');
    } catch {
      AgriCore.showToast('Network error. Please try again.', 'error');
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = 'Send Verification Code';
    }
  });

  // OTP auto-advance + auto-verify
  document.querySelectorAll('.otp-input').forEach((input, idx, inputs) => {
    input.addEventListener('input', async (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val;
      if (val && idx < inputs.length - 1) inputs[idx + 1].focus();

      // Auto-verify when all 6 digits entered
      const otpCode = Array.from(inputs).map(i => i.value).join('');
      if (otpCode.length === 6) {
        const email = document.getElementById('signupEmail').value.trim();
        try {
          const res = await fetch(AgriCore.API_URL + '/auth/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code: otpCode }),
          });
          const data = await res.json();

          if (res.ok) {
            emailVerified = true;
            AgriCore.showToast('Email verified successfully!', 'success');
            inputs.forEach(i => { i.disabled = true; });
          } else {
            AgriCore.showToast(data.message || 'Invalid code.', 'error');
            inputs.forEach(i => { i.value = ''; });
            inputs[0].focus();
          }
        } catch {
          AgriCore.showToast('Network error. Please try again.', 'error');
        }
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) inputs[idx - 1].focus();
    });
  });

  document.getElementById('resendOtpBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value.trim();
    try {
      const res = await fetch(AgriCore.API_URL + '/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        AgriCore.showToast('New verification code sent to your email!', 'success');
        document.querySelectorAll('.otp-input').forEach(i => { i.value = ''; i.disabled = false; });
        document.querySelector('.otp-input').focus();
        emailVerified = false;
      } else {
        AgriCore.showToast(data.message || 'Failed to resend code.', 'error');
      }
    } catch {
      AgriCore.showToast('Network error. Please try again.', 'error');
    }
  });

  // --- File Upload ---
  function setupFileUpload(uploadAreaId, inputId, listId) {
    const area = document.getElementById(uploadAreaId);
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);

    area.addEventListener('click', () => input.click());

    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.style.borderColor = 'var(--primary)';
    });

    area.addEventListener('dragleave', () => {
      area.style.borderColor = '';
    });

    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.style.borderColor = '';
      showFiles(e.dataTransfer.files, list);
    });

    input.addEventListener('change', () => showFiles(input.files, list));
  }

  function showFiles(files, listEl) {
    const esc = AgriCore.escapeHtml;
    listEl.innerHTML = Array.from(files).map(f =>
      `<div class="badge badge-info" style="margin:4px;">${esc(f.name)}</div>`
    ).join('');
  }

  setupFileUpload('photoUpload', 'farmPhotos', 'photoList');
  setupFileUpload('docUpload', 'farmDocs', 'docList');

  // --- Submit Application ---
  document.getElementById('submitApplicationBtn').addEventListener('click', () => {
    const termsCheckbox = document.getElementById('agreeTerms');
    if (!termsCheckbox || !termsCheckbox.checked) {
      AgriCore.showToast('You must accept the Terms & Services before creating your account.', 'error');
      return;
    }

    const role = roleInput.value;
    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();

    const newUser = { name, email, role, id: Date.now().toString() };

    if (role === 'farmer') {
      newUser.farmName = document.getElementById('farmName').value.trim();
      newUser.province = document.getElementById('farmProvince').value;
      newUser.district = document.getElementById('farmDistrict').value.trim();
      newUser.farmSize = document.getElementById('farmSize').value;
      newUser.farmerType = document.getElementById('farmerType').value;
      newUser.mainActivity = document.getElementById('mainActivity').value;
    } else {
      newUser.department = document.getElementById('deptName').value.trim();
      newUser.employeeId = document.getElementById('employeeId').value.trim();
      newUser.province = document.getElementById('govProvince').value;
      newUser.position = document.getElementById('govPosition').value.trim();
    }

    AgriCore.setCurrentUser(newUser);
    AgriCore.showToast('Application submitted successfully!', 'success');

    setTimeout(() => {
      window.location.href = '/platform/dashboard';
    }, 1200);
  });
});
