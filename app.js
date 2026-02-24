// Clés localStorage — préfixe "gnof" = nom du site (gnof-the-shark.github.io)
const STORAGE_TODOS   = 'gnof_todos';
const STORAGE_SESSION = 'gnof_session';
const STORAGE_TOKEN   = 'gnof_gh_token';

// Token de déploiement injecté par GitHub Actions (jamais en clair dans le dépôt).
// Permet la synchronisation GitHub sans que l'utilisateur ait à fournir son propre token.
// Pour l'activer : ajoutez le secret GH_DEPLOY_TOKEN dans les paramètres du dépôt,
// puis relancez le workflow GitHub Actions.
const GH_DEPLOY_TOKEN = '';

// ─── Identifiants autorisés (SHA-256 — jamais en clair dans le code) ──────────
// Pour changer les identifiants : mettez à jour les secrets GitHub AUTH_EMAIL_HASH
// et AUTH_PASS_HASH, puis relancez le workflow GitHub Actions.
const AUTH_EMAIL_HASH = '2d946c857aa07c0c58862ebb2146f91792538fc6cef8be9f0040ba2164452d3f';
const AUTH_PASS_HASH  = 'ff98ef67b552532453d1ad8b1912a776ab1b30bf3814fa009b8ffe3c3e5b7efe';

// GitHub API — tous les commits vont dans ce dépôt
const GH_OWNER  = 'Gnof-the-shark';
const GH_REPO   = 'gnof-the-shark.github.io';
const GH_FILE   = 'todos.json';
const GH_BRANCH = 'main';

let todos     = [];
let ghFileSha = null;  // SHA requis par l'API GitHub pour les mises à jour
let syncTimer = null;  // timer debounce pour limiter les appels API

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Priorité : token saisi manuellement > token de déploiement intégré
function getToken() { return localStorage.getItem(STORAGE_TOKEN) || GH_DEPLOY_TOKEN || ''; }

// Encodage base64 UTF-8 sans les fonctions dépréciées unescape/escape
function b64Encode(str) {
  const bytes = new TextEncoder().encode(str);
  return btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
}
function b64Decode(b64) {
  const bytes = Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// SHA-256 via Web Crypto API (natif, aucune dépendance)
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Persistance locale ───────────────────────────────────────────────────────
function loadTodosLocal() {
  try { todos = JSON.parse(localStorage.getItem(STORAGE_TODOS) || '[]'); }
  catch (e) { todos = []; }
}

function saveTodosLocal() {
  localStorage.setItem(STORAGE_TODOS, JSON.stringify(todos));
}

// ─── GitHub API ───────────────────────────────────────────────────────────────
async function githubGet() {
  const token = getToken();
  if (!token) {
    // Lecture publique sans token — URL raw, aucune authentification requise
    const res = await fetch(
      `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${GH_FILE}`,
      { cache: 'no-store' }
    );
    if (res.status === 404) { ghFileSha = null; return []; }
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    ghFileSha = null; // SHA indisponible via URL raw ; récupéré lors du premier githubPut
    return res.json();
  }
  const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}` };
  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`,
    { headers }
  );
  if (res.status === 404) { ghFileSha = null; return []; }
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = await res.json();
  ghFileSha = data.sha;
  return JSON.parse(b64Decode(data.content));
}

async function githubPut(retryCount = 0) {
  const token = getToken();
  if (!token) return;
  setSyncStatus('saving');
  const body = {
    message: 'Mise à jour des tâches',
    content: b64Encode(JSON.stringify(todos))  // compact pour l'API
  };
  if (ghFileSha) body.sha = ghFileSha;
  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );
  if (res.status === 409 || res.status === 422) {
    // 409 : conflit SHA (modif concurrente) ; 422 : SHA manquant (lu via URL raw)
    // Dans les deux cas : re-fetch du SHA via l'API et retry (max 3 fois)
    if (retryCount >= 3) throw new Error(`GitHub ${res.status}: conflit SHA persistant`);
    await githubGet();
    return githubPut(retryCount + 1);
  }
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = await res.json();
  ghFileSha = data.content.sha;
  setSyncStatus('saved');
}

function scheduleSave() {
  clearTimeout(syncTimer);
  setSyncStatus('pending');
  syncTimer = setTimeout(async () => {
    try { await githubPut(); }
    catch (e) { console.error('GitHub save:', e); setSyncStatus('error'); }
  }, 2000);
}

function setSyncStatus(status) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  const states = {
    pending: ['🔄 En attente…',  'rgba(255,200,60,.9)'],
    saving:  ['⬆ Sync GitHub…', 'rgba(100,180,255,.9)'],
    saved:   ['✓ Sync GitHub',   'rgba(60,220,120,.9)'],
    error:   ['✗ Erreur GitHub', 'rgba(255,80,100,.9)'],
  };
  const [text, color] = states[status] || ['', 'transparent'];
  el.textContent = text;
  el.style.color  = color;
  if (status === 'saved') setTimeout(() => { el.textContent = ''; }, 3000);
}

// ─── Sauvegarde (locale + GitHub) ────────────────────────────────────────────
function saveTodos() {
  saveTodosLocal();
  if (getToken()) scheduleSave();
}

// ─── Rendu ───────────────────────────────────────────────────────────────────
function renderTodos() {
  const list = document.getElementById('todoList');
  list.innerHTML = '';
  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = 'item todo-item' + (todo.done ? ' done' : '');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'todo-check';
    cb.checked = todo.done;
    cb.addEventListener('change', () => {
      todos[idx].done = cb.checked;
      saveTodos();
      li.classList.toggle('done', cb.checked);
    });

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;
    text.contentEditable = 'true';
    text.spellcheck = false;
    text.addEventListener('blur', () => {
      const t = text.textContent.trim();
      if (t) { todos[idx].text = t; saveTodos(); }
      else { text.textContent = todos[idx].text; }
    });
    text.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); text.blur(); }
      if (e.key === 'Escape') { text.textContent = todos[idx].text; text.blur(); }
    });

    const del = document.createElement('button');
    del.className = 'danger todo-del';
    del.textContent = '×';
    del.title = 'Supprimer';
    del.addEventListener('click', () => { todos.splice(idx, 1); saveTodos(); renderTodos(); });

    li.appendChild(cb);
    li.appendChild(text);
    li.appendChild(del);
    list.appendChild(li);
  });
}

// ─── Ajouter ─────────────────────────────────────────────────────────────────
function addTodo() {
  const input = document.getElementById('newTodo');
  const text = input.value.trim();
  if (!text) return;
  todos.push({ text, done: false });
  saveTodos();
  renderTodos();
  input.value = '';
  input.focus();
}

document.getElementById('addBtn').addEventListener('click', addTodo);
document.getElementById('newTodo').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

// ─── Affichage app ───────────────────────────────────────────────────────────
async function showApp() {
  document.getElementById('loginCard').closest('.liquidGL').classList.add('hidden');
  document.getElementById('appCard').closest('.liquidGL').classList.remove('hidden');
  document.getElementById('appCard').classList.remove('hidden');

  if (getToken()) setSyncStatus('pending');
  try {
    const ghTodos = await githubGet();
    if (!Array.isArray(ghTodos)) throw new Error('Format inattendu depuis GitHub');
    todos = ghTodos;
    saveTodosLocal();
    setSyncStatus(getToken() ? 'saved' : '');
    renderTodos();
    return;
  } catch (e) {
    console.warn('GitHub load failed, using localStorage:', e);
    if (getToken()) setSyncStatus('error');
  }
  loadTodosLocal();
  renderTodos();
}

function showLogin() {
  document.getElementById('loginCard').closest('.liquidGL').classList.remove('hidden');
  document.getElementById('appCard').closest('.liquidGL').classList.add('hidden');
  document.getElementById('appCard').classList.add('hidden');
}

// ─── Connexion ───────────────────────────────────────────────────────────────
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const token    = document.getElementById('loginToken').value.trim();
  const errorEl  = document.getElementById('loginError');

  if (!email || !password) {
    showError(errorEl, 'Veuillez remplir tous les champs.'); return;
  }

  const [eHash, pHash] = await Promise.all([sha256(email.toLowerCase()), sha256(password)]);
  if (eHash !== AUTH_EMAIL_HASH || pHash !== AUTH_PASS_HASH) {
    showError(errorEl, 'Identifiants incorrects.'); return;
  }

  errorEl.style.display = 'none';
  localStorage.setItem(STORAGE_SESSION, '1');
  if (token) localStorage.setItem(STORAGE_TOKEN, token);
  showApp();
});

document.getElementById('loginPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

// ─── Déconnexion ─────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_SESSION);
  document.getElementById('loginEmail').value    = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginToken').value    = '';
  document.getElementById('loginError').style.display = 'none';
  showLogin();
});

// ─── Export JSON ─────────────────────────────────────────────────────────────
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(todos, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'todos.json' });
  a.click();
  URL.revokeObjectURL(url);
});

// ─── Import JSON ─────────────────────────────────────────────────────────────
document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!Array.isArray(parsed)) throw new Error('Format invalide');
      todos = parsed.filter(t => typeof t.text === 'string').map(t => ({ text: t.text, done: !!t.done }));
      saveTodos();
      renderTodos();
    } catch (err) {
      alert(`Fichier JSON invalide : ${err.message}`);
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ─── Utilitaire ──────────────────────────────────────────────────────────────
function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

// ─── Masque le champ token si un token de déploiement est déjà intégré ───────
if (GH_DEPLOY_TOKEN) {
  const tokenDetails = document.querySelector('.token-details');
  if (tokenDetails) tokenDetails.style.display = 'none';
}

// ─── Restauration automatique de session ─────────────────────────────────────
if (localStorage.getItem(STORAGE_SESSION)) {
  showApp();
}
