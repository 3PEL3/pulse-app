// website/app.js
const nameInput = document.getElementById('nameInput');
const saveBtn = document.getElementById('saveBtn');
const greeting = document.getElementById('greeting');
const avatar = document.getElementById('avatar');

const countEl = document.getElementById('count');
const incBtn = document.getElementById('incBtn');
const decBtn = document.getElementById('decBtn');
const resetBtn = document.getElementById('resetBtn');
const progressBar = document.getElementById('progressBar');

const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const todoMeta = document.getElementById('todoMeta');
const todoEmpty = document.getElementById('todoEmpty');
const clearDoneBtn = document.getElementById('clearDoneBtn');

const themeBtn = document.getElementById('themeBtn');
const statName = document.getElementById('statName');
const statCount = document.getElementById('statCount');
const statTodos = document.getElementById('statTodos');
const authLink = document.getElementById('authLink');
const logoutBtn = document.getElementById('logoutBtn');
const userBadge = document.getElementById('userBadge');
const adminLink = document.getElementById('adminLink');
const ADMINS = ['mustafabus.n.h.sh@gmail.com'];

function currentAccount() {
  try {
    const email = (localStorage.getItem('pulse_session') || '').toLowerCase();
    if (!email) return null;
    const users = JSON.parse(localStorage.getItem('pulse_users') || '{}');
    return users[email] || null;
  } catch { return null; }
}
function renderAuth() {
  const acc = currentAccount();
  if (!authLink || !logoutBtn || !userBadge) return;
  authLink.hidden = !!acc;
  logoutBtn.hidden = !acc;
  userBadge.hidden = !acc;
  if (acc) userBadge.textContent = acc.name;
  if (adminLink) adminLink.hidden = !(acc && ADMINS.includes((acc.email || '').toLowerCase()));
  // Real backend session (async upgrade)
  try {
    const CFG = window.PULSE_CONFIG || {};
    if (window.supabase && CFG.SUPABASE_URL && !String(CFG.SUPABASE_URL).includes('YOUR_')) {
      const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
      sb.auth.getSession().then(async ({ data }) => {
        const user = data.session && data.session.user;
        if (!user) return;
        const name = (user.user_metadata && user.user_metadata.name) || user.email.split('@')[0];
        userBadge.hidden = false;
        userBadge.textContent = name;
        authLink.hidden = true;
        logoutBtn.hidden = false;
        if (adminLink) adminLink.hidden = !ADMINS.includes((user.email || '').toLowerCase());
      });
    }
  } catch {}
}
if (logoutBtn) logoutBtn.addEventListener('click', async () => {
  localStorage.removeItem('pulse_session');
  try {
    const CFG = window.PULSE_CONFIG || {};
    if (window.supabase && CFG.SUPABASE_URL && !String(CFG.SUPABASE_URL).includes('YOUR_')) {
      const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
      await sb.auth.signOut();
    }
  } catch {}
  renderAuth();
  renderProfile();
});

// --- Theme ---
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

// --- Greeting (prefers logged-in account name) ---
function renderProfile() {
  const acc = currentAccount();
  const stored = (localStorage.getItem('name') || '').trim();
  const name = acc ? acc.name : stored;
  const display = name || 'Guest';
  greeting.textContent = name ? `Hello, ${name}` : '';
  avatar.textContent = (display[0] || 'G').toUpperCase();
  statName.textContent = display;
  if (!nameInput.value) nameInput.value = name;
}
function saveName() {
  localStorage.setItem('name', nameInput.value.trim());
  renderProfile();
}
saveBtn.addEventListener('click', saveName);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveName(); } });

// --- Counter ---
let count = Number(localStorage.getItem('count') || 0);
function renderCount(pop = false) {
  countEl.textContent = count;
  statCount.textContent = count;
  localStorage.setItem('count', count);
  const pct = ((count % 100) + 100) % 100;
  progressBar.style.width = pct + '%';
  if (pop) {
    countEl.classList.remove('pop');
    void countEl.offsetWidth;
    countEl.classList.add('pop');
  }
}
incBtn.addEventListener('click', () => { count++; renderCount(true); });
decBtn.addEventListener('click', () => { count--; renderCount(true); });
resetBtn.addEventListener('click', () => { count = 0; renderCount(true); });

// --- Todos (migrate old string[] to {text, done}) ---
function loadTodos() {
  try {
    const raw = JSON.parse(localStorage.getItem('todos') || '[]');
    return raw.map((t) => typeof t === 'string' ? { text: t, done: false } : { text: t.text || '', done: !!t.done });
  } catch { return []; }
}
let todos = loadTodos();
function saveTodos() { localStorage.setItem('todos', JSON.stringify(todos)); }
function renderTodos() {
  todoList.innerHTML = '';
  todos.forEach((todo, i) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = todo.done;
    check.className = 'todo-check';
    check.setAttribute('aria-label', 'Mark done');
    check.addEventListener('change', () => {
      todos[i].done = check.checked;
      saveTodos();
      renderTodos();
    });
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.className = 'btn-delete';
    del.type = 'button';
    del.addEventListener('click', () => {
      todos.splice(i, 1);
      saveTodos();
      renderTodos();
    });
    li.append(check, span, del);
    todoList.appendChild(li);
  });
  const left = todos.filter((t) => !t.done).length;
  todoMeta.textContent = todos.length === 0 ? '0 tasks' : `${left} left • ${todos.length} total`;
  statTodos.textContent = left;
  todoEmpty.style.display = todos.length ? 'none' : 'block';
}
todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const task = todoInput.value.trim();
  if (!task) return;
  todos.unshift({ text: task, done: false });
  saveTodos();
  todoInput.value = '';
  renderTodos();
});
clearDoneBtn.addEventListener('click', () => {
  todos = todos.filter((t) => !t.done);
  saveTodos();
  renderTodos();
});

// init + auth gate: login first
async function boot() {
  loadTheme();
  const local = !!currentAccount();
  let authed = local;
  try {
    const CFG = window.PULSE_CONFIG || {};
    if (!local && window.supabase && CFG.SUPABASE_URL && !String(CFG.SUPABASE_URL).includes('YOUR_')) {
      const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
      const { data } = await sb.auth.getSession();
      authed = !!data.session;
    }
  } catch {}
  if (!authed) {
    window.location.replace('auth.html');
    return;
  }
  renderAuth();
  renderProfile();
  renderCount();
  renderTodos();
}
boot();
