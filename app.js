// Clés localStorage — préfixe "gnof" = nom du site (gnof-the-shark.github.io)
const STORAGE_TODOS   = 'gnof_todos';
const STORAGE_SESSION = 'gnof_session';

// --- État ---
let todos = [];

function loadTodos() {
  try { todos = JSON.parse(localStorage.getItem(STORAGE_TODOS) || '[]'); }
  catch (e) { todos = []; }
}

function saveTodos() {
  localStorage.setItem(STORAGE_TODOS, JSON.stringify(todos));
}

// --- Rendu de la liste ---
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
      if (e.key === 'Enter') { e.preventDefault(); text.blur(); }
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

// --- Ajouter une tâche ---
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

// --- Affichage app / connexion ---
function showApp() {
  document.getElementById('loginCard').closest('.liquidGL').classList.add('hidden');
  document.getElementById('appCard').closest('.liquidGL').classList.remove('hidden');
  document.getElementById('appCard').classList.remove('hidden');
  loadTodos();
  renderTodos();
}

function showLogin() {
  document.getElementById('loginCard').closest('.liquidGL').classList.remove('hidden');
  document.getElementById('appCard').closest('.liquidGL').classList.add('hidden');
  document.getElementById('appCard').classList.add('hidden');
}

// --- Connexion (n'importe quel email + mot de passe ≥ 4 caractères) ---
document.getElementById('loginBtn').addEventListener('click', () => {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl  = document.getElementById('loginError');

  if (!email || !password) {
    showError(errorEl, 'Veuillez remplir tous les champs.'); return;
  }
  if (password.length < 4) {
    showError(errorEl, 'Le mot de passe doit contenir au moins 4 caractères.'); return;
  }

  errorEl.style.display = 'none';
  localStorage.setItem(STORAGE_SESSION, '1');
  showApp();
});

document.getElementById('loginPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

// --- Déconnexion ---
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_SESSION);
  document.getElementById('loginEmail').value    = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').style.display = 'none';
  showLogin();
});

// --- Export JSON ---
document.getElementById('exportBtn').addEventListener('click', () => {
  const data = JSON.stringify(todos, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: 'todos.json'
  });
  a.click();
  URL.revokeObjectURL(url);
});

// --- Import JSON ---
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
      alert('Fichier JSON invalide. Vérifiez le format.');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

// --- Restauration automatique de la session ---
if (localStorage.getItem(STORAGE_SESSION)) {
  showApp();
}
