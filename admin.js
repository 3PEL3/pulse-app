// website/admin.js — demo-only developer list (localStorage, not secure)
const ADMINS = ['mustafabus.n.h.sh@gmail.com'];
const themeBtn = document.getElementById('themeBtn');
function loadTheme() {
  const t = localStorage.getItem('theme') || 'light';
  document.documentElement.dataset.theme = t;
  themeBtn.textContent = t === 'light' ? 'Dark mode' : 'Light mode';
}
themeBtn.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
  themeBtn.textContent = next === 'light' ? 'Dark mode' : 'Light mode';
});
loadTheme();

const email = (localStorage.getItem('pulse_session') || '').toLowerCase();
const denied = document.getElementById('denied');
const adminBody = document.getElementById('adminBody');
const adminSub = document.getElementById('adminSub');

if (!ADMINS.includes(email)) {
  denied.hidden = false;
  adminSub.textContent = 'Logged in as: ' + (email || 'nobody');
} else {
  adminSub.textContent = 'Logged in as developer: ' + email;
  denied.hidden = true;
  adminBody.hidden = false;
  let users = {};
  try { users = JSON.parse(localStorage.getItem('pulse_users') || '{}'); } catch {}
  const rows = document.getElementById('userRows');
  const list = Object.values(users);
  rows.innerHTML = '';
  list.forEach((u) => {
    const tr = document.createElement('tr');
    const tdN = document.createElement('td'); tdN.textContent = u.name;
    const tdE = document.createElement('td'); tdE.textContent = u.email;
    const tdC = document.createElement('td'); tdC.textContent = u.created ? new Date(u.created).toLocaleString() : '-';
    tr.append(tdN, tdE, tdC);
    rows.appendChild(tr);
  });
  document.getElementById('userCount').textContent = list.length + ' account(s) on this device.';
}
