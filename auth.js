// website/auth.js — demo-only local auth (localStorage, no server)
const themeBtn = document.getElementById('themeBtn');
const tabSignin = document.getElementById('tabSignin');
const tabSignup = document.getElementById('tabSignup');
const signinForm = document.getElementById('signinForm');
const signupForm = document.getElementById('signupForm');
const formError = document.getElementById('formError');
const formOk = document.getElementById('formOk');

function loadTheme() {
  const t = localStorage.getItem('theme') || 'light';
  document.documentElement.dataset.theme = t;
  if (themeBtn) themeBtn.textContent = t === 'light' ? 'Dark mode' : 'Light mode';
}
if (themeBtn) themeBtn.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
  themeBtn.textContent = next === 'light' ? 'Dark mode' : 'Light mode';
});

function showTab(which) {
  const isIn = which === 'signin';
  tabSignin.classList.toggle('active', isIn);
  tabSignup.classList.toggle('active', !isIn);
  signinForm.classList.toggle('hidden', !isIn);
  signupForm.classList.toggle('hidden', isIn);
  fail('');
  ok('');
}
tabSignin.addEventListener('click', () => showTab('signin'));
tabSignup.addEventListener('click', () => showTab('signup'));

function fail(m) { formError.textContent = m || ''; }
function ok(m) { formOk.textContent = m || ''; }

function getUsers() {
  try { return JSON.parse(localStorage.getItem('pulse_users') || '{}'); }
  catch { return {}; }
}
function saveUsers(u) { localStorage.setItem('pulse_users', JSON.stringify(u)); }

async function hashPw(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('pulse:' + pw));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// If already logged in, go home
if (localStorage.getItem('pulse_session')) {
  window.location.replace('index.html');
}

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  fail(''); ok('');
  const name = document.getElementById('upName').value.trim();
  const email = document.getElementById('upEmail').value.trim().toLowerCase();
  const pw = document.getElementById('upPass').value;
  if (!name || !email || pw.length < 6) { fail('Fill all fields, password min 6 chars.'); return; }
  const users = getUsers();
  if (users[email]) { fail('Account already exists. Log in instead.'); showTab('signin'); return; }
  users[email] = { name, email, passHash: await hashPw(pw), created: Date.now() };
  saveUsers(users);
  localStorage.setItem('pulse_session', email);
  ok('Account created. Redirecting…');
  setTimeout(() => window.location.replace('index.html'), 600);
});

signinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  fail(''); ok('');
  const email = document.getElementById('inEmail').value.trim().toLowerCase();
  const pw = document.getElementById('inPass').value;
  const users = getUsers();
  const acc = users[email];
  if (!acc) { fail('No account for this email. Sign up first.'); return; }
  if ((await hashPw(pw)) !== acc.passHash) { fail('Wrong password.'); return; }
  localStorage.setItem('pulse_session', email);
  ok('Logged in. Redirecting…');
  setTimeout(() => window.location.replace('index.html'), 600);
});

loadTheme();
