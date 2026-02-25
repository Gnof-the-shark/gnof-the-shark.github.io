// Clés localStorage — préfixe "gnof" = nom du site (gnof-the-shark.github.io)
// Token de déploiement injecté par GitHub Actions (jamais en clair dans le dépôt).
// Pour l'activer : ajoutez le secret GH_DEPLOY_TOKEN dans les paramètres du dépôt,
// puis relancez le workflow GitHub Actions.
export const GH_DEPLOY_TOKEN = '';

// ─── Identifiants autorisés (SHA-256 — jamais en clair dans le code) ──────────
// Pour changer les identifiants : mettez à jour les secrets GitHub AUTH_EMAIL_HASH
// et AUTH_PASS_HASH, puis relancez le workflow GitHub Actions.
export const AUTH_EMAIL_HASH = '2d946c857aa07c0c58862ebb2146f91792538fc6cef8be9f0040ba2164452d3f';
export const AUTH_PASS_HASH  = 'ff98ef67b552532453d1ad8b1912a776ab1b30bf3814fa009b8ffe3c3e5b7efe';
