// Demo credentials (UI demo only – no real auth)
const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "password123";

// --- Login ---
document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorEl = document.getElementById("loginError");

  if (!email || !password) {
    showError(errorEl, "Veuillez remplir tous les champs.");
    return;
  }

  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    showError(errorEl, "Email ou mot de passe incorrect.");
    return;
  }

  // Success: hide login, show app
  errorEl.style.display = "none";
  document.getElementById("loginCard").closest(".liquidGL").classList.add("hidden");
  document.getElementById("appCard").closest(".liquidGL").classList.remove("hidden");
  document.getElementById("appCard").classList.remove("hidden");
});

// Allow pressing Enter on password field
document.getElementById("loginPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("loginBtn").click();
});

// --- Logout ---
document.getElementById("logoutBtn").addEventListener("click", () => {
  document.getElementById("loginCard").closest(".liquidGL").classList.remove("hidden");
  document.getElementById("appCard").closest(".liquidGL").classList.add("hidden");
  document.getElementById("appCard").classList.add("hidden");
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
  document.getElementById("loginError").style.display = "none";
});

// --- Add password entry ---
document.getElementById("addBtn").addEventListener("click", () => {
  const site = document.getElementById("newSite").value.trim();
  const login = document.getElementById("newLogin").value.trim();
  const pass = document.getElementById("newPass").value;
  if (!site || !login || !pass) return;

  const list = document.getElementById("passwordList");
  const li = document.createElement("li");
  li.className = "item";

  const siteEl = document.createElement("div");
  siteEl.style.cssText = "font-weight:600;font-size:14px;";
  siteEl.textContent = site;

  const loginEl = document.createElement("div");
  loginEl.className = "muted";
  loginEl.style.cssText = "font-size:13px;margin-top:3px;";
  loginEl.textContent = login;

  const infoDiv = document.createElement("div");
  infoDiv.appendChild(siteEl);
  infoDiv.appendChild(loginEl);

  const passSpan = document.createElement("span");
  passSpan.style.cssText = "font-family:monospace;letter-spacing:2px;";
  passSpan.textContent = "••••••••";

  const delBtn = document.createElement("button");
  delBtn.className = "danger";
  delBtn.style.cssText = "font-size:12px;padding:5px 10px;";
  delBtn.textContent = "Suppr.";
  delBtn.addEventListener("click", () => li.remove());

  const actionsDiv = document.createElement("div");
  actionsDiv.style.cssText = "display:flex;gap:8px;align-items:center;";
  actionsDiv.appendChild(passSpan);
  actionsDiv.appendChild(delBtn);

  li.appendChild(infoDiv);
  li.appendChild(actionsDiv);
  list.appendChild(li);

  document.getElementById("newSite").value = "";
  document.getElementById("newLogin").value = "";
  document.getElementById("newPass").value = "";
});

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = "block";
}
