'use client';

import { useEffect, useState } from 'react';
import ScormsTable from '../components/ScormsTable';
import ScormsCursosTable from '../components/ScormsCursosTable';
import { supabase } from '../lib/supabaseClient';

const SESSION_STORAGE_KEY = 'gscormer_user_session';

export default function HomePage() {
  const [activeView, setActiveView] = useState('scorms');
  const [userSession, setUserSession] = useState(null);
  const [loginName, setLoginName] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [newPassConfirm, setNewPassConfirm] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState('');

  useEffect(() => {
    const storedSession = globalThis?.localStorage?.getItem(SESSION_STORAGE_KEY);

    if (!storedSession) {
      return;
    }

    try {
      const parsed = JSON.parse(storedSession);
      if (parsed?.id && parsed?.name) {
        setUserSession(parsed);
      }
    } catch (_error) {
      globalThis?.localStorage?.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();

    const trimmedName = String(loginName || '').trim();
    const trimmedPass = String(loginPass || '').trim();

    if (!trimmedName || !trimmedPass) {
      setLoginError('Introduce usuario y contraseña.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    const response = await supabase
      .from('scorms_users')
      .select('id, name, agente')
      .eq('name', trimmedName)
      .eq('pass', trimmedPass)
      .limit(1)
      .maybeSingle();

    if (response.error || !response.data) {
      setLoginError('Credenciales no válidas.');
      setLoginLoading(false);
      return;
    }

    const nextSession = {
      id: response.data.id,
      name: response.data.name,
      agente: response.data.agente || '',
    };

    setUserSession(nextSession);
    globalThis?.localStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setLoginPass('');
    setLoginLoading(false);
  };

  const handleLogout = () => {
    setUserSession(null);
    setPasswordModalOpen(false);
    setPasswordStatus('');
    setNewPass('');
    setNewPassConfirm('');
    globalThis?.localStorage?.removeItem(SESSION_STORAGE_KEY);
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    const trimmedPass = String(newPass || '').trim();

    if (trimmedPass.length < 3) {
      setPasswordStatus('La nueva contraseña debe tener al menos 3 caracteres.');
      return;
    }

    if (trimmedPass !== String(newPassConfirm || '').trim()) {
      setPasswordStatus('La confirmación no coincide.');
      return;
    }

    setPasswordLoading(true);
    setPasswordStatus('');

    const response = await supabase.from('scorms_users').update({ pass: trimmedPass }).eq('id', userSession.id);

    if (response.error) {
      setPasswordStatus(`No se pudo cambiar la contraseña: ${response.error.message}`);
      setPasswordLoading(false);
      return;
    }

    setPasswordStatus('Contraseña actualizada correctamente.');
    setNewPass('');
    setNewPassConfirm('');
    setPasswordLoading(false);
  };

  if (!userSession) {
    return (
      <main className="page auth-page">
        <section className="card auth-card">
          <h1>GScormer</h1>
          <p className="status">Inicia sesión para acceder a la aplicación.</p>
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              Usuario
              <input
                type="text"
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                placeholder="name"
                autoComplete="username"
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={loginPass}
                onChange={(event) => setLoginPass(event.target.value)}
                placeholder="pass"
                autoComplete="current-password"
              />
            </label>
            {loginError && <p className="status error">{loginError}</p>}
            <button type="submit" disabled={loginLoading}>
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card">
        <div className="card-header">
          <div>
            <h1>GScormer</h1>
            <p className="status">Selecciona la vista a gestionar.</p>
          </div>
          <div className="header-actions app-switcher">
            <button
              className={activeView === 'scorms' ? '' : 'secondary'}
              onClick={() => setActiveView('scorms')}
            >
              SCORMs
            </button>
            <button
              className={activeView === 'cursos' ? '' : 'secondary'}
              onClick={() => setActiveView('cursos')}
            >
              SCORMs Cursos
            </button>
            <button type="button" className="secondary user-badge" onClick={() => setPasswordModalOpen(true)}>
              <span className="user-dot" aria-hidden="true" />
              <span>{userSession.name}</span>
            </button>
          </div>
        </div>
      </section>

      {activeView === 'scorms' ? (
        <ScormsTable userSession={userSession} />
      ) : (
        <ScormsCursosTable onBackToScorms={() => setActiveView('scorms')} />
      )}

      {passwordModalOpen && (
        <div className="modal-overlay" role="presentation" onClick={() => setPasswordModalOpen(false)}>
          <section className="modal-content modal-content-narrow" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>{userSession.name}</h3>
            <p className="status">Usuario conectado</p>
            <form className="auth-form" onSubmit={handleChangePassword}>
              <label>
                Nueva contraseña
                <input
                  type="password"
                  value={newPass}
                  onChange={(event) => setNewPass(event.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <label>
                Confirmar contraseña
                <input
                  type="password"
                  value={newPassConfirm}
                  onChange={(event) => setNewPassConfirm(event.target.value)}
                  autoComplete="new-password"
                />
              </label>
              {passwordStatus && <p className={passwordStatus.includes('correctamente') ? 'status ok' : 'status error'}>{passwordStatus}</p>}
              <div className="header-actions">
                <button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? 'Guardando...' : 'Guardar contraseña'}
                </button>
                <button type="button" className="secondary" onClick={handleLogout}>
                  Cerrar sesión
                </button>
                <button type="button" className="secondary" onClick={() => setPasswordModalOpen(false)}>
                  Cerrar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
