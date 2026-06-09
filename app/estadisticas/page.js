'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_VERSION } from '../../lib/appVersion';
import { supabase } from '../../lib/supabaseClient';

const DIMENSIONS = {
  category: { field: 'scorm_categoria', label: 'Categoría' },
  responsible: { field: 'scorm_responsable', label: 'Responsable' },
  language: { field: 'scorm_idioma', label: 'Idioma' },
};

const PIE_COLORS = ['#4f8fe8', '#4db69b', '#f2b35d', '#9b7de3', '#e9788f', '#5bb8d1', '#8cbf55', '#d98b5f'];
const EMPTY_FILTERS = { category: [], responsible: [], language: [], dateFrom: '', dateTo: '' };
const SESSION_STORAGE_KEY = 'gscormer_user_session';

const cleanValue = (value, fallback = 'Sin informar') => String(value || '').trim() || fallback;

const splitResponsibles = (value) => {
  const values = String(value || '')
    .split(/[&,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length ? [...new Set(values)] : ['Sin informar'];
};

const valuesForDimension = (row, dimension) => {
  if (dimension === 'responsible') {
    return splitResponsibles(row.scorm_responsable);
  }

  return [cleanValue(row[DIMENSIONS[dimension].field])];
};

const normalizeDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatCount = (value) => new Intl.NumberFormat('es-ES').format(value);

function HorizontalBarChart({ data, selectedValues, onToggle }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="analytics-scroll analytics-scroll-vertical" role="list" aria-label="SCORMs por categoría">
      {data.map((item) => {
        const selected = selectedValues.includes(item.label);
        return (
          <button
            type="button"
            className={`analytics-horizontal-row${selected ? ' is-selected' : ''}`}
            key={item.label}
            onClick={() => onToggle(item.label)}
            title={`${item.label}: ${formatCount(item.value)} SCORMs`}
            aria-pressed={selected}
          >
            <span className="analytics-axis-label">{item.label}</span>
            <span className="analytics-horizontal-track">
              <span className="analytics-horizontal-bar" style={{ width: `${Math.max((item.value / maxValue) * 100, 2)}%` }} />
            </span>
            <strong className="analytics-measure-label">{formatCount(item.value)}</strong>
          </button>
        );
      })}
      {!data.length && <div className="analytics-empty-chart">No hay categorías para los filtros actuales.</div>}
    </div>
  );
}

function VerticalBarChart({ data, selectedValues, onToggle }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="analytics-scroll analytics-scroll-horizontal" aria-label="SCORMs por responsable">
      <div className="analytics-vertical-chart" style={{ minWidth: `${Math.max(data.length * 92, 520)}px` }}>
        {data.map((item) => {
          const selected = selectedValues.includes(item.label);
          return (
            <button
              type="button"
              className={`analytics-vertical-item${selected ? ' is-selected' : ''}`}
              key={item.label}
              onClick={() => onToggle(item.label)}
              title={`${item.label}: ${formatCount(item.value)} SCORMs`}
              aria-pressed={selected}
            >
              <strong>{formatCount(item.value)}</strong>
              <span className="analytics-vertical-track">
                <span className="analytics-vertical-bar" style={{ height: `${Math.max((item.value / maxValue) * 100, 3)}%` }} />
              </span>
              <span className="analytics-vertical-label">{item.label}</span>
            </button>
          );
        })}
        {!data.length && <div className="analytics-empty-chart">No hay responsables para los filtros actuales.</div>}
      </div>
    </div>
  );
}

const piePoint = (angle, radius = 46) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(radians), y: 50 + radius * Math.sin(radians) };
};

const piePath = (startAngle, endAngle) => {
  const start = piePoint(startAngle);
  const end = piePoint(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M 50 50 L ${start.x} ${start.y} A 46 46 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

function PieChart({ data, selectedValues, onToggle }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let accumulatedAngle = 0;

  return (
    <div className="analytics-pie-layout">
      <div className="analytics-pie-wrap">
        <svg className="analytics-pie-svg" viewBox="0 0 100 100" role="img" aria-label={`Distribución de ${formatCount(total)} SCORMs por idioma`}>
          {data.length ? data.map((item, index) => {
            const startAngle = accumulatedAngle;
            const sliceAngle = (item.value / total) * 360;
            const endAngle = accumulatedAngle + (sliceAngle >= 360 ? 359.999 : sliceAngle);
            accumulatedAngle += sliceAngle;
            const selected = selectedValues.includes(item.label);
            return (
              <path
                key={item.label}
                d={piePath(startAngle, endAngle)}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
                className={selected ? 'is-selected' : ''}
                onClick={() => onToggle(item.label)}
                role="button"
                tabIndex="0"
                aria-label={`${item.label}: ${formatCount(item.value)} SCORMs`}
                aria-pressed={selected}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onToggle(item.label);
                  }
                }}
              />
            );
          }) : <circle cx="50" cy="50" r="46" fill="#e8eef7" />}
        </svg>
        <div className="analytics-pie-center">
          <strong>{formatCount(total)}</strong>
          <span>SCORMs</span>
        </div>
      </div>
      <div className="analytics-legend">
        {data.map((item, index) => {
          const selected = selectedValues.includes(item.label);
          return (
            <button
              type="button"
              className={`analytics-legend-item${selected ? ' is-selected' : ''}`}
              key={item.label}
              onClick={() => onToggle(item.label)}
              aria-pressed={selected}
            >
              <span className="analytics-legend-color" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
              <span>{item.label}</span>
              <strong>{formatCount(item.value)}</strong>
            </button>
          );
        })}
        {!data.length && <div className="analytics-empty-chart">No hay idiomas para los filtros actuales.</div>}
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [activeSection, setActiveSection] = useState('scorms');
  const [activeSheet, setActiveSheet] = useState('general');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    let mounted = true;

    const readStoredSession = () => {
      try {
        const storedValue = globalThis?.localStorage?.getItem(SESSION_STORAGE_KEY);
        if (!storedValue) return null;

        const storedSession = JSON.parse(storedValue);
        if (!storedSession?.id || !storedSession?.name) return null;
        return storedSession;
      } catch (_error) {
        return null;
      }
    };

    const loadRows = async () => {
      try {
        const { data, error } = await supabase
          .from('scorms_master')
          .select('id, scorm_categoria, scorm_responsable, scorm_idioma, created_at')
          .order('id', { ascending: true });

        if (!mounted) return;
        if (error) {
          setLoadError(`No se pudo cargar la información estadística: ${error.message}`);
        } else {
          setRows(data || []);
        }
      } catch (_error) {
        if (mounted) setLoadError('No se pudo conectar con la vista estadística.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const refreshServerSession = async (storedSession) => {
      try {
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        const sessionJson = await sessionResponse.json().catch(() => null);

        if (!mounted) return false;
        if (sessionResponse.ok && sessionJson?.user) {
          const refreshedSession = { ...storedSession, ...sessionJson.user };
          setUserSession(refreshedSession);
          setAuthReady(true);
          globalThis?.localStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(refreshedSession));
          return true;
        }
      } catch (_error) {
        // La sesión local mantiene la navegación activa si falla la renovación.
      }

      return false;
    };

    const loadDashboard = async () => {
      const storedSession = readStoredSession();

      if (storedSession) {
        setUserSession(storedSession);
        setAuthReady(true);
        loadRows();
        refreshServerSession(storedSession);
        return;
      }

      const serverSessionAvailable = await refreshServerSession(null);
      if (!mounted) return;

      if (!serverSessionAvailable) {
        router.replace('/');
        return;
      }

      loadRows();
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [router]);

  const availableValues = useMemo(() => {
    const result = {};
    Object.keys(DIMENSIONS).forEach((dimension) => {
      result[dimension] = [...new Set(rows.flatMap((row) => valuesForDimension(row, dimension)))].sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' })
      );
    });
    return result;
  }, [rows]);

  const rowsMatchingFilters = (excludedDimension = '') =>
    rows.filter((row) => {
      const matchesDimensions = Object.keys(DIMENSIONS).every((dimension) => {
        if (dimension === excludedDimension || !filters[dimension].length) return true;
        return valuesForDimension(row, dimension).some((value) => filters[dimension].includes(value));
      });
      if (!matchesDimensions) return false;

      const rowDate = normalizeDate(row.created_at);
      if (filters.dateFrom && (!rowDate || rowDate < filters.dateFrom)) return false;
      if (filters.dateTo && (!rowDate || rowDate > filters.dateTo)) return false;
      return true;
    });

  const filteredRows = useMemo(() => rowsMatchingFilters(), [filters, rows]);

  const chartData = useMemo(() => {
    const result = {};
    Object.keys(DIMENSIONS).forEach((dimension) => {
      const counts = new Map();
      rowsMatchingFilters(dimension).forEach((row) => {
        valuesForDimension(row, dimension).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
      });
      result[dimension] = [...counts.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'es'));
    });
    return result;
  }, [filters, rows]);

  const toggleFilter = (dimension, value) => {
    setFilters((current) => ({
      ...current,
      [dimension]: current[dimension].includes(value)
        ? current[dimension].filter((item) => item !== value)
        : [...current[dimension], value],
    }));
  };

  const removeFilter = (dimension, value) => {
    setFilters((current) => ({ ...current, [dimension]: current[dimension].filter((item) => item !== value) }));
  };

  const activeFilterCount = Object.keys(DIMENSIONS).reduce((sum, dimension) => sum + filters[dimension].length, 0) +
    Number(Boolean(filters.dateFrom)) + Number(Boolean(filters.dateTo));

  if (!authReady) {
    return (
      <main className="page auth-page">
        <section className="card auth-card">
          <h1>GScormer Analytics</h1>
          <p className={loadError ? 'status error' : 'status'}>{loadError || 'Validando sesión...'}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page analytics-page">
      <section className="card analytics-topbar">
        <div>
          <p className="analytics-eyebrow">GScormer · Versión {APP_VERSION}</p>
          <h1>Vista estadística</h1>
          <p className="status">Analiza la información y selecciona valores directamente sobre los gráficos.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary" onClick={() => router.push('/')}>← Volver a gestión</button>
          <span className="analytics-user"><span className="user-dot" />{userSession?.name}</span>
        </div>
      </section>

      <section className="card analytics-workspace">
        <div className="analytics-section-tabs" role="tablist" aria-label="Secciones estadísticas">
          <button type="button" className={activeSection === 'scorms' ? 'is-active' : ''} onClick={() => setActiveSection('scorms')}>SCORMs</button>
          <button type="button" className={activeSection === 'cursos' ? 'is-active' : ''} onClick={() => setActiveSection('cursos')}>CURSOS</button>
        </div>

        <div className="analytics-sheet-tabs" role="tablist" aria-label="Hojas estadísticas">
          <button type="button" className={activeSheet === 'general' ? 'is-active' : ''} onClick={() => setActiveSheet('general')}>Vista general</button>
          <button type="button" className={activeSheet === 'detail' ? 'is-active' : ''} onClick={() => setActiveSheet('detail')}>Detalle de selección</button>
        </div>

        {activeSection === 'cursos' ? (
          <div className="analytics-coming-soon">
            <span>CURSOS</span>
            <h2>Hoja estadística preparada</h2>
            <p>La navegación independiente de cursos queda disponible para incorporar sus dimensiones y medidas en una siguiente consolidación.</p>
          </div>
        ) : (
          <>
            <aside className="analytics-filter-panel" aria-label="Filtros de la hoja">
              <div className="analytics-filter-heading">
                <div>
                  <span className="analytics-eyebrow">Selección activa</span>
                  <strong>{activeFilterCount ? `${activeFilterCount} filtros aplicados` : 'Todos los SCORMs'}</strong>
                </div>
                <button type="button" className="secondary" onClick={() => setFilters(EMPTY_FILTERS)} disabled={!activeFilterCount}>Quitar todos</button>
              </div>

              <div className="analytics-filter-controls">
                {Object.entries(DIMENSIONS).map(([dimension, config]) => (
                  <label key={dimension}>
                    {config.label}
                    <select value="" onChange={(event) => event.target.value && toggleFilter(dimension, event.target.value)}>
                      <option value="">Seleccionar valor…</option>
                      {availableValues[dimension].map((value) => <option value={value} key={value}>{value}</option>)}
                    </select>
                  </label>
                ))}
                <label>Fecha desde<input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} /></label>
                <label>Fecha hasta<input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} /></label>
              </div>

              {activeFilterCount > 0 && (
                <div className="analytics-filter-chips">
                  {Object.keys(DIMENSIONS).flatMap((dimension) => filters[dimension].map((value) => (
                    <button type="button" key={`${dimension}-${value}`} onClick={() => removeFilter(dimension, value)}>
                      <span>{DIMENSIONS[dimension].label}: {value}</span><strong aria-hidden="true">×</strong>
                    </button>
                  )))}
                  {filters.dateFrom && <button type="button" onClick={() => setFilters((current) => ({ ...current, dateFrom: '' }))}><span>Desde: {filters.dateFrom}</span><strong>×</strong></button>}
                  {filters.dateTo && <button type="button" onClick={() => setFilters((current) => ({ ...current, dateTo: '' }))}><span>Hasta: {filters.dateTo}</span><strong>×</strong></button>}
                </div>
              )}
            </aside>

            {loadError && <p className="status error analytics-message">{loadError}</p>}
            {loading ? <p className="status analytics-message">Cargando información estadística...</p> : activeSheet === 'general' ? (
              <div className="analytics-grid">
                <article className="analytics-chart-card analytics-chart-wide">
                  <header><div><span>Gráfico 1</span><h2>SCORMs por categoría</h2></div><strong>{formatCount(filteredRows.length)} registros</strong></header>
                  <p className="analytics-chart-help">Selecciona una barra para aplicar o quitar el filtro en toda la hoja.</p>
                  <HorizontalBarChart data={chartData.category} selectedValues={filters.category} onToggle={(value) => toggleFilter('category', value)} />
                </article>

                <article className="analytics-chart-card">
                  <header><div><span>Gráfico 2</span><h2>SCORMs por responsable</h2></div><strong>Nº SCORMs</strong></header>
                  <p className="analytics-chart-help">Desplázate horizontalmente para consultar todos los responsables.</p>
                  <VerticalBarChart data={chartData.responsible} selectedValues={filters.responsible} onToggle={(value) => toggleFilter('responsible', value)} />
                </article>

                <article className="analytics-chart-card">
                  <header><div><span>Gráfico 3</span><h2>SCORMs por idioma</h2></div><strong>Nº SCORMs</strong></header>
                  <p className="analytics-chart-help">Selecciona directamente una porción o utiliza su elemento de leyenda.</p>
                  <PieChart data={chartData.language} selectedValues={filters.language} onToggle={(value) => toggleFilter('language', value)} />
                </article>
              </div>
            ) : (
              <div className="analytics-detail-sheet">
                <div><span>Resultado actual</span><strong>{formatCount(filteredRows.length)}</strong><small>SCORMs</small></div>
                {Object.entries(DIMENSIONS).map(([dimension, config]) => (
                  <section key={dimension}>
                    <h3>{config.label}</h3>
                    <div>{chartData[dimension].map((item) => <button type="button" key={item.label} onClick={() => toggleFilter(dimension, item.label)}><span>{item.label}</span><strong>{formatCount(item.value)}</strong></button>)}</div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
