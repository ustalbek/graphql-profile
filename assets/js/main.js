/**
 * Application entry: routing, auth events, profile bootstrap.
 */
import {
  signIn,
  getToken,
  setToken,
  clearToken,
} from './api/auth.js';
import { graphqlRequest } from './api/graphql.js';
import { loadProfileData } from './services/profile.js';
import { renderProfile } from './ui/profileRender.js';

const loginView = document.getElementById('login-view');
const profileView = document.getElementById('profile-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginSubmit = document.getElementById('login-submit');
const logoutBtn = document.getElementById('logout-btn');
const profileLoading = document.getElementById('profile-loading');
const profileContent = document.getElementById('profile-content');
const profileGlobalError = document.getElementById('profile-global-error');
const explorerQuery = document.getElementById('explorer-query');
const explorerRun = document.getElementById('explorer-run');
const explorerResponse = document.getElementById('explorer-response');

const profileEls = {
  basicInfo: document.getElementById('basic-info'),
  xpTotal: document.getElementById('xp-total'),
  gradeStats: document.getElementById('grade-stats'),
  recentProjects: document.getElementById('recent-projects'),
  chartLine: document.getElementById('chart-xp-line'),
  chartPie: document.getElementById('chart-pass-pie'),
};

function showLogin() {
  loginView.classList.remove('hidden');
  loginView.removeAttribute('aria-hidden');
  profileView.classList.add('hidden');
  profileView.setAttribute('aria-hidden', 'true');
  document.getElementById('identifier')?.focus();
}

function showProfile() {
  loginView.classList.add('hidden');
  loginView.setAttribute('aria-hidden', 'true');
  profileView.classList.remove('hidden');
  profileView.removeAttribute('aria-hidden');
}

/** @param {string} [msg] */
function setLoginError(msg) {
  if (!msg) {
    loginError.hidden = true;
    loginError.textContent = '';
    return;
  }
  loginError.hidden = false;
  loginError.textContent = msg;
}

async function openProfile() {
  const jwt = getToken();
  if (!jwt) {
    showLogin();
    return;
  }
  showProfile();
  profileGlobalError.hidden = true;
  profileContent.hidden = true;
  profileLoading.hidden = false;
  profileLoading.setAttribute('aria-busy', 'true');

  try {
    const data = await loadProfileData(jwt);
    renderProfile(profileEls, data);
    profileLoading.hidden = true;
    profileLoading.setAttribute('aria-busy', 'false');
    profileContent.hidden = false;
    document.getElementById('main-content')?.focus({ preventScroll: true });
  } catch (e) {
    profileLoading.hidden = true;
    profileLoading.setAttribute('aria-busy', 'false');
    profileGlobalError.hidden = false;
    profileGlobalError.textContent =
      e instanceof Error
        ? e.message
        : 'Failed to load profile. Try logging in again.';
  }
}

loginForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  setLoginError('');
  const idEl = document.getElementById('identifier');
  const pwEl = document.getElementById('password');
  const identifier = (idEl.value || '').trim();
  const password = pwEl.value || '';
  if (!identifier || !password) {
    setLoginError('Please enter username/email and password.');
    return;
  }
  loginSubmit.disabled = true;
  loginSubmit.setAttribute('aria-busy', 'true');
  try {
    const token = await signIn(identifier, password);
    setToken(token);
    pwEl.value = '';
    await openProfile();
  } catch {
    clearToken();
    setLoginError('Invalid username/email or password.');
  } finally {
    loginSubmit.disabled = false;
    loginSubmit.removeAttribute('aria-busy');
  }
});

logoutBtn.addEventListener('click', () => {
  clearToken();
  showLogin();
  setLoginError('');
});

explorerRun.addEventListener('click', async () => {
  const jwt = getToken();
  if (!jwt) return;
  explorerRun.disabled = true;
  explorerResponse.textContent = 'Loading…';
  try {
    const data = await graphqlRequest(jwt, explorerQuery.value);
    explorerResponse.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    explorerResponse.textContent =
      e instanceof Error ? e.message : String(e);
  } finally {
    explorerRun.disabled = false;
  }
});

if (getToken()) {
  openProfile();
} else {
  showLogin();
}
