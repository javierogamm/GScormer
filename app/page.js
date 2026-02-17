'use client';

import { useEffect, useState } from 'react';
import ScormsTable from '../components/ScormsTable';
import ScormsCursosTable from '../components/ScormsCursosTable';
import { supabase } from '../lib/supabaseClient';
import { APP_VERSION } from '../lib/appVersion';

const SESSION_STORAGE_KEY = 'gscormer_user_session';
const AGENT_SPLIT_REGEX = /[&,;|]/;

const parseAgentList = (value) =>
  String(value || '')
    .split(AGENT_SPLIT_REGEX)
    .map((item) => item.trim())
    .filter(Boolean);

const dedupeValues = (values = []) => {
  const uniqueByNormalized = new Map();

  values.forEach((value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      return;
    }

    const normalized = trimmed.toLocaleLowerCase('es-ES');
    if (!uniqueByNormalized.has(normalized)) {
      uniqueByNormalized.set(normalized, trimmed);
    }
  });

  return [...uniqueByNormalized.values()];
};

const parseAgentConfig = (agentValue) => {
  const raw = String(agentValue || '').trim();

  if (!raw) {
    return { responsables: [], instructores: [] };
  }

  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === 'object') {
      const responsables = dedupeValues(Array.isArray(parsed.responsables) ? parsed.responsables : []);
      const instructores = dedupeValues(Array.isArray(parsed.instructores) ? parsed.instructores : []);
      return { responsables, instructores };
    }
  } catch (_error) {
    // Compatibilidad con formato legacy en texto plano.
  }

  const legacyValues = dedupeValues(parseAgentList(raw));
  return { responsables: legacyValues, instructores: legacyValues };
};

const stringifyAgentConfig = (config) => {
  const normalized = {
    responsables: dedupeValues(config?.responsables || []),
    instructores: dedupeValues(config?.instructores || []),
  };

  return JSON.stringify(normalized);
};

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
  const [identifyAgentLoading, setIdentifyAgentLoading] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentOptionsLoading, setAgentOptionsLoading] = useState(false);
  const [agentSaveLoading, setAgentSaveLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState('');
  const [responsableOptions, setResponsableOptions] = useState([]);
  const [instructorOptions, setInstructorOptions] = useState([]);
  const [selectedResponsables, setSelectedResponsables] = useState([]);
  const [selectedInstructores, setSelectedInstructores] = useState([]);

  useEffect(() => {
    const storedSession = globalThis?.localStorage?.getItem(SESSION_STORAGE_KEY);

    if (!storedSession) {
      return;
    }

    try {
      const parsed = JSON.parse(storedSession);
      if (parsed?.id && parsed?.name) {
        const parsedConfig = parseAgentConfig(parsed.agent || parsed.agente);
        setUserSession({
          ...parsed,
          agent: parsed.agent || parsed.agente || '',
          agente: parsedConfig.responsables.join(', '),
          agentFilters: parsedConfig,
        });
        setSelectedResponsables(parsedConfig.responsables);
        setSelectedInstructores(parsedConfig.instructores);
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
      .select('*')
      .eq('name', trimmedName)
      .eq('pass', trimmedPass)
      .limit(1)
      .maybeSingle();

    if (response.error || !response.data) {
      setLoginError('Credenciales no válidas.');
      setLoginLoading(false);
      return;
    }

    const agentRawValue = String(response.data.agent || response.data.agente || '').trim();
    const parsedConfig = parseAgentConfig(agentRawValue);

    const nextSession = {
      id: response.data.id,
      name: response.data.name,
      agent: agentRawValue,
      agente: parsedConfig.responsables.join(', '),
      agentFilters: parsedConfig,
    };

    setUserSession(nextSession);
    setSelectedResponsables(parsedConfig.responsables);
    setSelectedInstructores(parsedConfig.instructores);
    globalThis?.localStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setLoginPass('');
    setLoginLoading(false);
  };

  const selectedAgentsCount = selectedResponsables.length + selectedInstructores.length;
  const userBadgeLabel = `${userSession?.name || 'Usuario'} · ${selectedAgentsCount} asociaciones`;

  const handleIdentifyAgent = async () => {
    if (!userSession?.id) {
      setPasswordStatus('No hay sesión activa para identificar el agente.');
      return;
    }

    setIdentifyAgentLoading(true);
    setPasswordStatus('');

    const response = await supabase
      .from('scorms_users')
      .select('id, name, agent, agente')
      .eq('id', userSession.id)
      .limit(1)
      .maybeSingle();

    if (response.error || !response.data) {
      setPasswordStatus('No se pudo identificar/reenganchar el agente del usuario.');
      setIdentifyAgentLoading(false);
      return;
    }

    const linkedAgent = String(response.data.agent || response.data.agente || '').trim();
    const parsedConfig = parseAgentConfig(linkedAgent);
    const nextSession = {
      ...userSession,
      name: response.data.name || userSession.name,
      agent: linkedAgent,
      agente: parsedConfig.responsables.join(', '),
      agentFilters: parsedConfig,
    };

    setUserSession(nextSession);
    setSelectedResponsables(parsedConfig.responsables);
    setSelectedInstructores(parsedConfig.instructores);
    globalThis?.localStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setPasswordStatus(linkedAgent ? 'Asociaciones recargadas desde base de datos.' : 'Usuario reenganchado, pero sin asociaciones guardadas.');
    setIdentifyAgentLoading(false);
  };

  const loadAgentOptions = async () => {
    setAgentOptionsLoading(true);
    setAgentStatus('');

    const [masterResponse, cursosResponse] = await Promise.all([
      supabase.from('scorms_master').select('scorm_responsable'),
      supabase.from('scorms_cursos').select('curso_instructor'),
    ]);

    if (masterResponse.error || cursosResponse.error) {
      setAgentStatus('No se pudieron cargar responsables/instructores.');
      setAgentOptionsLoading(false);
      return;
    }

    const responsables = dedupeValues(
      (masterResponse.data || []).flatMap((row) => parseAgentList(row.scorm_responsable))
    ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    const instructores = dedupeValues(
      (cursosResponse.data || []).flatMap((row) => parseAgentList(row.curso_instructor))
    ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    setResponsableOptions(responsables);
    setInstructorOptions(instructores);
    setAgentOptionsLoading(false);
  };

  const openAgentModal = async () => {
    setAgentModalOpen(true);
    await loadAgentOptions();
  };

  const toggleAgentSelection = (value, selectedValues, setter) => {
    setter(
      selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value]
    );
  };

  const handleSaveAgentAssociations = async () => {
    if (!userSession?.id) {
      setAgentStatus('No hay sesión activa.');
      return;
    }

    setAgentSaveLoading(true);
    setAgentStatus('');

    const config = {
      responsables: selectedResponsables,
      instructores: selectedInstructores,
    };
    const serializedAgent = stringifyAgentConfig(config);

    const response = await supabase.from('scorms_users').update({ agent: serializedAgent }).eq('id', userSession.id);

    if (response.error) {
      setAgentStatus(`No se pudo guardar: ${response.error.message}`);
      setAgentSaveLoading(false);
      return;
    }

    const nextSession = {
      ...userSession,
      agent: serializedAgent,
      agente: selectedResponsables.join(', '),
      agentFilters: config,
    };

    setUserSession(nextSession);
    globalThis?.localStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setAgentStatus('Asociaciones guardadas correctamente.');
    setAgentSaveLoading(false);
  };

  const handleLogout = () => {
    setUserSession(null);
    setPasswordModalOpen(false);
    setAgentModalOpen(false);
    setPasswordStatus('');
    setAgentStatus('');
    setNewPass('');
    setNewPassConfirm('');
    setSelectedResponsables([]);
    setSelectedInstructores([]);
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
            <p className="status">Versión {APP_VERSION}</p>
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
            <button type="button" className="secondary" onClick={openAgentModal}>
              Asociar mi usuario a agente
            </button>
            <button type="button" className="secondary user-badge" onClick={() => setPasswordModalOpen(true)}>
              <span className="user-dot" aria-hidden="true" />
              <span>{userBadgeLabel}</span>
            </button>
          </div>
        </div>
      </section>

      {activeView === 'scorms' ? (
        <ScormsTable userSession={userSession} />
      ) : (
        <ScormsCursosTable userSession={userSession} onBackToScorms={() => setActiveView('scorms')} />
      )}

      {passwordModalOpen && (
        <div className="modal-overlay" role="presentation" onClick={() => setPasswordModalOpen(false)}>
          <section className="modal-content modal-content-narrow" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>{userSession.name}</h3>
            <p className="status">Usuario conectado · Asociaciones: {selectedAgentsCount}</p>
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
                <button type="button" className="secondary" onClick={handleIdentifyAgent} disabled={identifyAgentLoading}>
                  {identifyAgentLoading ? 'Identificando...' : 'Identificar agente'}
                </button>
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

      {agentModalOpen && (
        <div className="modal-overlay" role="presentation" onClick={() => setAgentModalOpen(false)}>
          <section className="modal-content" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>Asociar mi usuario a agente</h3>
            <p className="status">Selecciona responsables e instructores para el usuario {userSession?.name}.</p>
            {agentOptionsLoading ? <p className="status">Cargando valores...</p> : null}
            <div className="agent-association-grid">
              <div className="agent-column">
                <h4>Responsables de SCORM</h4>
                {responsableOptions.map((value) => (
                  <label key={`responsable-${value}`} className="agent-check-row">
                    <input
                      type="checkbox"
                      checked={selectedResponsables.includes(value)}
                      onChange={() => toggleAgentSelection(value, selectedResponsables, setSelectedResponsables)}
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
              <div className="agent-column">
                <h4>Instructores de cursos</h4>
                {instructorOptions.map((value) => (
                  <label key={`instructor-${value}`} className="agent-check-row">
                    <input
                      type="checkbox"
                      checked={selectedInstructores.includes(value)}
                      onChange={() => toggleAgentSelection(value, selectedInstructores, setSelectedInstructores)}
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </div>
            {agentStatus ? <p className={agentStatus.includes('correctamente') ? 'status ok' : 'status error'}>{agentStatus}</p> : null}
            <div className="header-actions">
              <button type="button" onClick={handleSaveAgentAssociations} disabled={agentSaveLoading}>
                {agentSaveLoading ? 'Guardando...' : 'Guardar asociaciones'}
              </button>
              <button type="button" className="secondary" onClick={() => setAgentModalOpen(false)}>
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
