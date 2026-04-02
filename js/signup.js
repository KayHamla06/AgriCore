/* ============================================
   AgriCore — Signup Page JS
   Uses Supabase Auth — no SMTP.
   Email verification is handled by Supabase automatically.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  let currentStep = 1;

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

  // --- Step Navigation (3 steps now: Account → Details → Review) ---
  function goToStep(step) {
    if (step > currentStep && !validateStep(currentStep)) return;

    if (step === 2) {
      const role = roleInput.value;
      document.getElementById('farmerForm').classList.toggle('active', role === 'farmer');
      document.getElementById('govForm').classList.toggle('active', role === 'government');
      lucide.createIcons();
    }

    if (step === 3) {
      buildReview();
    }

    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('step' + step).classList.add('active');

    // Update dots & lines
    for (let i = 1; i <= 4; i++) {
      const dot = document.getElementById('stepDot' + i);
      if (!dot) continue;
      dot.classList.remove('active', 'completed');
      if (i < step) dot.classList.add('completed');
      else if (i === step) dot.classList.add('active');
    }
    for (let i = 1; i <= 3; i++) {
      const line = document.getElementById('stepLine' + i);
      if (line) line.classList.toggle('filled', i < step);
    }

    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Wire navigation buttons
  document.getElementById('step1Next').addEventListener('click', async () => {
    if (!validateStep(1)) return;

    const email = document.getElementById('signupEmail').value.trim();
    const btn = document.getElementById('step1Next');
    btn.disabled = true;
    btn.textContent = 'Checking...';

    try {
      const res = await AgriCore.apiPost('/auth/check-email', { email });
      if (res.success && res.available === false) {
        AgriCore.showToast('That email is already registered. Please use a different email or log in.', 'error');
        return;
      }
    } catch (_) {
      // If check fails, let backend handle duplicate detection at signup
    } finally {
      btn.disabled = false;
      btn.textContent = 'Next';
    }

    goToStep(2);
  });
  document.getElementById('step2Back').addEventListener('click', () => goToStep(1));
  document.getElementById('step2Next').addEventListener('click', () => goToStep(3));
  document.getElementById('step3Back').addEventListener('click', () => goToStep(2));

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

  // --- File Upload ---
  function setupFileUpload(uploadAreaId, inputId, listId) {
    const area = document.getElementById(uploadAreaId);
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);

    if (!area || !input || !list) return;

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

  // --- Submit Application (calls real /api/auth/signup) ---
  document.getElementById('submitApplicationBtn').addEventListener('click', async () => {
    const termsCheckbox = document.getElementById('agreeTerms');
    if (!termsCheckbox || !termsCheckbox.checked) {
      AgriCore.showToast('You must accept the Terms & Services before creating your account.', 'error');
      return;
    }

    const role = roleInput.value;
    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    const submitBtn = document.getElementById('submitApplicationBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
      const payload = { name, email, password, role };

      // Add role-specific fields
      if (role === 'farmer') {
        payload.farmName = document.getElementById('farmName').value.trim();
        payload.province = document.getElementById('farmProvince').value;
        payload.district = document.getElementById('farmDistrict').value.trim();
        payload.farmSize = document.getElementById('farmSize').value;
        payload.farmerType = document.getElementById('farmerType').value;
        payload.mainActivity = document.getElementById('mainActivity').value;
      } else {
        payload.department = document.getElementById('deptName').value.trim();
        payload.employeeId = document.getElementById('employeeId').value.trim();
        payload.province = document.getElementById('govProvince').value;
        payload.position = document.getElementById('govPosition').value.trim();
      }

      const res = await AgriCore.apiPost('/auth/signup', payload);

      if (res.success) {
        AgriCore.showToast('Account created! Please check your email to verify your account.', 'success');

        // Show confirmation panel instead of redirecting to dashboard
        document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));

        const confirmPanel = document.createElement('div');
        confirmPanel.className = 'step-panel active';
        confirmPanel.innerHTML = `
          <div style="text-align:center; padding:2rem;">
            <div style="font-size:3rem; margin-bottom:1rem;">📧</div>
            <h2>Check Your Email</h2>
            <p style="color:var(--text-secondary); margin:1rem 0;">
              We've sent a verification link to <strong>${AgriCore.escapeHtml(email)}</strong>.
              Click the link in the email to verify your account and log in.
            </p>
            ${role === 'government' ? '<p style="color:var(--warning); margin:1rem 0;"><strong>Note:</strong> Government accounts require additional admin verification after email verification.</p>' : ''}
            <div style="margin-top:2rem;">
              <a href="/login" class="btn btn-primary">Go to Login</a>
            </div>
            <p style="margin-top:1rem; font-size:0.85rem; color:var(--text-muted);">
              Didn't receive the email? Check your spam folder or
              <a href="#" id="resendSignupVerify">click here to resend</a>.
            </p>
          </div>
        `;
        document.querySelector('.signup-card').appendChild(confirmPanel);
        lucide.createIcons();

        // Resend handler
        const resendLink = document.getElementById('resendSignupVerify');
        if (resendLink) {
          resendLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
              const rr = await AgriCore.apiPost('/auth/resend-verification', { email });
              if (rr.success) {
                AgriCore.showToast('Verification email resent!', 'success');
              } else {
                AgriCore.showToast(rr.error || 'Failed to resend. Try again later.', 'error');
              }
            } catch {
              AgriCore.showToast('Network error.', 'error');
            }
          });
        }
      } else {
        AgriCore.showToast(res.error || res.message || 'Signup failed. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    } catch (err) {
      AgriCore.showToast('Network error. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
});
