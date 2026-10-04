// website/auth.js — simple email/password + security question, no 2FA
const themeBtn = document.getElementById('themeBtn');
const tabSignin = document.getElementById('tabSignin');
const tabSignup = document.getElementById('tabSignup');
const signinForm = document.getElementById('signinForm');
const signupForm = document.getElementById('signupForm');
const formError = document.getElementById('formError');
const formOk = document.getElementById('formOk');
const backendBadge = document.getElementById('backendBadge');

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
loadTheme();

function fail(m) { formError.textContent = m || ''; }
function ok(m) { formOk.textContent = m || ''; }
function showTab(which) {
  const isIn = which === 'signin';
  tabSignin.classList.toggle('active', isIn);
  tabSignup.classList.toggle('active', !isIn);
  signinForm.classList.toggle('hidden', !isIn);
  signupForm.classList.toggle('hidden', isIn);
  fail(''); ok('');
}
tabSignin.addEventListener('click', () => showTab('signin'));
tabSignup.addEventListener('click', () => showTab('signup'));

const CFG = (window.PULSE_CONFIG || {});
const USE_SUPABASE = !!(window.supabase && CFG.SUPABASE_URL && !String(CFG.SUPABASE_URL).includes('YOUR_'));
let sb = null;
if (USE_SUPABASE) {
  sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  backendBadge.textContent = 'Connected to Supabase — real accounts.';
} else {
  backendBadge.textContent = 'Demo mode — accounts stay in this browser.';
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem('pulse_users') || '{}'); }
  catch { return {}; }
}
function saveUsers(u) { localStorage.setItem('pulse_users', JSON.stringify(u)); }
async function hashPw(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('pulse:' + pw));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function goHome() { setTimeout(() => window.location.replace('index.html'), 600); }

if (!USE_SUPABASE) {
  if (localStorage.getItem('pulse_session')) window.location.replace('index.html');

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault(); fail(''); ok('');
    const name = document.getElementById('upName').value.trim();
    const email = document.getElementById('upEmail').value.trim().toLowerCase();
    const pw = document.getElementById('upPass').value;
    const favQ = document.getElementById('upQuestion').value;
    const favA = document.getElementById('upAnswer').value.trim();
    if (!name || !email || pw.length < 6 || !favA) { fail('Fill all fields + security answer.'); return; }
    const users = getUsers();
    if (users[email]) { fail('Account exists. Log in.'); showTab('signin'); return; }
    users[email] = { name, email, passHash: await hashPw(pw), favQ, favAHash: await hashPw(favA.toLowerCase()), created: Date.now() };
    saveUsers(users);
    localStorage.setItem('pulse_session', email);
    ok('Account created. Redirecting…');
    goHome();
  });

  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault(); fail(''); ok('');
    const email = document.getElementById('inEmail').value.trim().toLowerCase();
    const pw = document.getElementById('inPass').value;
    const acc = getUsers()[email];
    if (!acc) { fail('No account. Sign up first.'); return; }
    if ((await hashPw(pw)) !== acc.passHash) { fail('Wrong password.'); return; }
    localStorage.setItem('pulse_session', email);
    ok('Logged in. Redirecting…');
    goHome();
  });
}

if (USE_SUPABASE) {
  (async () => {
    const { data } = await sb.auth.getSession();
    if (data.session) window.location.replace('index.html');
  })();

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault(); fail(''); ok('');
    const name = document.getElementById('upName').value.trim();
    const email = document.getElementById('upEmail').value.trim().toLowerCase();
    const pw = document.getElementById('upPass').value;
    const favQ = document.getElementById('upQuestion').value;
    if (!name || !email || pw.length < 6) { fail('Fill all fields.'); return; }
    const { error } = await sb.auth.signUp({ email, password: pw, options: { data: { name, fav_q: favQ } } });
    if (error) { fail(error.message); return; }
    const { error: e2 } = await sb.auth.signInWithPassword({ email, password: pw });
    if (e2) { fail(e2.message); return; }
    ok('Account created. Redirecting…');
    goHome();
  });

  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault(); fail(''); ok('');
    const email = document.getElementById('inEmail').value.trim().toLowerCase();
    const pw = document.getElementById('inPass').value;
    const { error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) { fail(error.message); return; }
    ok('Logged in. Redirecting…');
    goHome();
  });
}
