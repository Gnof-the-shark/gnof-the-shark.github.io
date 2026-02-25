import { useState } from 'react'
import LiquidGlass from 'liquid-glass-react'
import { AUTH_EMAIL_HASH, AUTH_PASS_HASH, GH_DEPLOY_TOKEN } from './config.js'

// ─── Constantes ───────────────────────────────────────────────────────────────
const STORAGE_SESSION = 'gnof_session';
const STORAGE_TOKEN   = 'gnof_gh_token';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem(STORAGE_TOKEN) || GH_DEPLOY_TOKEN || ''; }

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState(
    localStorage.getItem(STORAGE_SESSION) ? 'app' : 'login'
  );
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginToken, setLoginToken]       = useState('');
  const [loginError, setLoginError]       = useState('');

  async function handleLogin() {
    if (!loginEmail || !loginPassword) {
      setLoginError('Veuillez remplir tous les champs.');
      return;
    }
    const [eHash, pHash] = await Promise.all([
      sha256(loginEmail.toLowerCase()),
      sha256(loginPassword),
    ]);
    if (eHash !== AUTH_EMAIL_HASH || pHash !== AUTH_PASS_HASH) {
      setLoginError('Identifiants incorrects.');
      return;
    }
    setLoginError('');
    localStorage.setItem(STORAGE_SESSION, '1');
    if (loginToken) localStorage.setItem(STORAGE_TOKEN, loginToken);
    setView('app');
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_SESSION);
    setLoginEmail('');
    setLoginPassword('');
    setLoginToken('');
    setLoginError('');
    setView('login');
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Ma liste de tâches</h1>
        <p className="muted">Connectez-vous pour accéder à vos tâches.</p>
      </header>

      {/* ── Carte connexion ─────────────────────────────────────────────── */}
      {view === 'login' && (
        <LiquidGlass
          cornerRadius={28}
          padding="22px"
          style={{ position: 'relative', top: 'auto', left: 'auto', margin: '20px auto', display: 'block' }}
        >
          <div className="card-inner">
            <h2 style={{ margin: '0 0 4px' }}>Connexion</h2>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px' }}>
              Accédez à votre liste de tâches.
            </p>
            <label className="label">
              Adresse e-mail
              <input
                type="email"
                placeholder="exemple@domaine.com"
                autoComplete="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
              />
            </label>
            <label className="label">
              Mot de passe
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </label>
            {!GH_DEPLOY_TOKEN && (
              <details className="token-details">
                <summary>
                  🔗 Synchronisation GitHub{' '}
                  <span className="muted" style={{ fontSize: '11px' }}>(optionnel)</span>
                </summary>
                <div style={{ marginTop: '8px' }}>
                  <label className="label">
                    Token GitHub Personnel
                    <input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxx"
                      autoComplete="off"
                      value={loginToken}
                      onChange={e => setLoginToken(e.target.value)}
                    />
                  </label>
                  <p className="muted" style={{ fontSize: '11px', margin: '4px 0 0' }}>
                    Renseignez ce champ uniquement si aucun token de déploiement n'est configuré.
                    Créez un token avec permission <code>Contents: Read &amp; Write</code> sur ce dépôt.{' '}
                    <a
                      href="https://github.com/settings/personal-access-tokens/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="token-link"
                    >
                      Créer un token →
                    </a>
                  </p>
                </div>
              </details>
            )}
            {loginError && (
              <div className="status login-error">{loginError}</div>
            )}
            <div className="row">
              <button onClick={handleLogin}>Se connecter</button>
            </div>
          </div>
        </LiquidGlass>
      )}

      {/* ── Carte codes de récupération ─────────────────────────────────── */}
      {view === 'app' && (
        <LiquidGlass
          cornerRadius={28}
          padding="22px"
          style={{ position: 'relative', top: 'auto', left: 'auto', margin: '20px auto', display: 'block' }}
        >
          <div className="card-inner">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button className="secondary icon-btn" onClick={handleLogout}>Déconnexion</button>
            </div>
            <pre style={{ fontFamily: 'monospace', fontSize: '16px', lineHeight: '1.8', textAlign: 'center', margin: '0' }}>
              {`0419 4843\n3740 3041\n1112 6175\n9960 8237\n9514 7698\n6289 0519\n4745 2966\n6341 5635\n5099 1922\n9334 2070`}
            </pre>
          </div>
        </LiquidGlass>
      )}
    </div>
  );
}
