document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var loadingState = document.getElementById('loadingState');
  var successState = document.getElementById('successState');
  var errorState = document.getElementById('errorState');
  var successMessage = document.getElementById('successMessage');
  var errorMessage = document.getElementById('errorMessage');
  var API_BASE = window.AGRICORE_API_BASE || '/api';

  function showSuccess(message, redirectUrl) {
    if (loadingState) loadingState.classList.add('hidden');
    if (errorState) errorState.classList.add('hidden');
    if (successState) successState.classList.remove('hidden');
    if (message && successMessage) successMessage.textContent = message;
    if (redirectUrl) {
      window.setTimeout(function () {
        window.location.href = redirectUrl;
      }, 1200);
    }
  }

  function showError(message) {
    if (loadingState) loadingState.classList.add('hidden');
    if (successState) successState.classList.add('hidden');
    if (errorState) errorState.classList.remove('hidden');
    if (message && errorMessage) errorMessage.textContent = message;
  }

  function fetchJson(url, options) {
    var controller = new AbortController();
    var timeoutId = window.setTimeout(function () {
      controller.abort();
    }, 15000);

    return fetch(url, Object.assign({}, options || {}, { signal: controller.signal }))
      .then(function (res) {
        return res.json().catch(function () {
          return { success: false, error: 'Unexpected server response.' };
        });
      })
      .finally(function () {
        window.clearTimeout(timeoutId);
      });
  }

  function getRedirectForUser(user) {
    if (user.role === 'government' && user.verification_status !== 'verified') {
      return '/pending-verification';
    }
    if (user.role === 'admin') {
      return '/platform/admin/console';
    }
    return '/platform/dashboard';
  }

  var hashParams = new URLSearchParams(window.location.hash.substring(1));
  var queryParams = new URLSearchParams(window.location.search);
  var accessToken = hashParams.get('access_token');
  var type = hashParams.get('type') || queryParams.get('type');
  var code = queryParams.get('code');

  if (type === 'recovery' && accessToken) {
    sessionStorage.setItem('agricore_reset_token', accessToken);
    showSuccess('Reset link verified. Redirecting you to choose a new password...', '/auth/reset-password');
    return;
  }

  if (accessToken) {
    fetchJson(API_BASE + '/auth/me', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    })
      .then(function (data) {
        if (!data.success || !data.data) {
          showError(data.error || 'We could not finish verifying your account. Please log in manually.');
          return;
        }

        var user = data.data;
        user.token = accessToken;
        AgriCore.setCurrentUser(user);
        showSuccess('Email verified successfully. Redirecting...', getRedirectForUser(user));
      })
      .catch(function (error) {
        if (error && error.name === 'AbortError') {
          showError('Verification timed out. Please refresh this page or log in manually.');
          return;
        }
        showError('Network error while finishing verification. Please try again.');
      });
    return;
  }

  if (code) {
    fetchJson(API_BASE + '/auth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: code }),
    })
      .then(function (data) {
        if (!data.success || !data.data || !data.data.user) {
          showError(data.error || 'Authentication failed.');
          return;
        }

        var user = data.data.user;
        user.token = data.data.token;
        AgriCore.setCurrentUser(user);
        showSuccess('Email verified successfully. Redirecting...', getRedirectForUser(user));
      })
      .catch(function (error) {
        if (error && error.name === 'AbortError') {
          showError('Authentication timed out. Please refresh this page or log in manually.');
          return;
        }
        showError('Network error during authentication.');
      });
    return;
  }

  showError('No authentication data was received. Please request a new link or log in manually.');
});
