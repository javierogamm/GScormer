'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_VERSION } from '../../lib/appVersion';
import { supabase } from '../../lib/supabaseClient';

const SCORM_DIMENSIONS = {
  category: { field: 'scorm_categoria', label: 'Categoría' },
  responsible: { field: 'scorm_responsable', label: 'Responsable' },
  language: { field: 'scorm_idioma', label: 'Idioma' },
};
const COURSE_DIMENSIONS = {
  course: { label: 'Curso' },
  matter: { label: 'Materia' },
  typology: { label: 'Tipología' },
  plan: { label: 'Plan de aprendizaje' },
};
const PIE_COLORS = ['#4f8fe8', '#4db69b', '#f2b35d', '#9b7de3', '#e9788f', '#5bb8d1', '#8cbf55', '#d98b5f'];
const EMPTY_SCORM_FILTERS = { category: [], responsible: [], language: [], dateFrom: '', dateTo: '' };
const EMPTY_COURSE_FILTERS = { course: [], matter: [], typology: [], plan: [] };
const SESSION_STORAGE_KEY = 'gscormer_user_session';
const SCORM_REFERENCE_REGEX = /(?:\b([a-z]{2,3})\s*[-_]\s*)?\b(SCR\d{4})\b/gi;

const cleanValue = (value, fallback = 'Sin informar') => String(value || '').trim() || fallback;
const formatCount = (value) => new Intl.NumberFormat('es-ES').format(value);
const normalizeText = (value) => String(value || '').trim().toLocaleUpperCase('es-ES');

const splitResponsibles = (value) => {
  const values = String(value || '').split(/[&,;|]/).map((item) => item.trim()).filter(Boolean);
  return values.length ? [...new Set(values)] : ['Sin informar'];
};

const scormValuesForDimension = (row, dimension) => {
  if (dimension === 'responsible') return splitResponsibles(row.scorm_responsable);
  return [cleanValue(row[SCORM_DIMENSIONS[dimension].field])];
};

const normalizeDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const isPlanRow = (row) => ['SI', 'SÍ', 'YES', 'TRUE', '1', 'X'].includes(normalizeText(row.pa_formaparte));

const getCourseKey = (row) => {
  const candidates = [row.IDUnico, row.idunico, row.id_unico, row.codigo_individual, row.curso_codigo, row.id];
  const key = candidates.map((value) => String(value ?? '').trim()).find(Boolean);
  return key || `curso-${row.id}`;
};

const getCourseLabel = (row, key) => {
  const code = cleanValue(row.curso_codigo || row.codigo_individual || key, 'Sin código');
  const name = cleanValue(row.curso_nombre, 'Sin nombre');
  return `${code} - ${name}`;
};

const getPlanLabel = (row) => {
  const code = cleanValue(row.pa_codigo, 'Sin código');
  const name = cleanValue(row.pa_nombre, 'Sin nombre');
  return `${code} - ${name}`;
};

const extractScormReferences = (contenido) => {
  const references = new Set();
  const source = String(contenido || '');
  SCORM_REFERENCE_REGEX.lastIndex = 0;
  let match = SCORM_REFERENCE_REGEX.exec(source);
  while (match) {
    const language = normalizeText(match[1]);
    const code = normalizeText(match[2]);
    references.add(language ? `${language}-${code}` : code);
    match = SCORM_REFERENCE_REGEX.exec(source);
  }
  return references;
};

const buildCourseModels = (rows) => {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = getCourseKey(row);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  });

  return [...grouped.entries()].map(([key, groupedRows]) => {
    const representative = groupedRows.find((row) => !isPlanRow(row) && normalizeText(row.relacion_tipo) === 'PADRE')
      || groupedRows.find((row) => !isPlanRow(row))
      || groupedRows.find((row) => normalizeText(row.relacion_tipo) === 'PADRE')
      || groupedRows[0];
    const matters = new Set();
    const typologies = new Set();
    const plans = new Set();
    const scorms = new Set();

    groupedRows.forEach((row) => {
      matters.add(cleanValue(row.materia));
      typologies.add(cleanValue(row.tipologia));
      if (isPlanRow(row) && (String(row.pa_codigo || '').trim() || String(row.pa_nombre || '').trim())) plans.add(getPlanLabel(row));
      extractScormReferences(row.contenido).forEach((reference) => scorms.add(reference));
    });

    return {
      key,
      label: getCourseLabel(representative, key),
      matters: [...matters],
      typologies: [...typologies],
      plans: [...plans],
      scorms: [...scorms],
    };
  }).sort((left, right) => left.label.localeCompare(right.label, 'es', { sensitivity: 'base' }));
};

function HorizontalBarChart({ data, selectedValues = [], onToggle, ariaLabel, emptyMessage, unitLabel }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="analytics-scroll analytics-scroll-vertical" role="list" aria-label={ariaLabel}>
      {data.map((item) => {
        const selected = selectedValues.includes(item.label);
        return (
          <button type="button" className={`analytics-horizontal-row${selected ? ' is-selected' : ''}`} key={item.label}
            onClick={() => onToggle(item.label)} title={`${item.label}: ${formatCount(item.value)} ${unitLabel}`} aria-pressed={selected}>
            <span className="analytics-axis-label">{item.label}</span>
            <span className="analytics-horizontal-track"><span className="analytics-horizontal-bar" style={{ width: `${Math.max((item.value / maxValue) * 100, item.value ? 2 : 0)}%` }} /></span>
            <strong className="analytics-measure-label">{formatCount(item.value)}</strong>
          </button>
        );
      })}
      {!data.length && <div className="analytics-empty-chart">{emptyMessage}</div>}
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
            <button type="button" className={`analytics-vertical-item${selected ? ' is-selected' : ''}`} key={item.label}
              onClick={() => onToggle(item.label)} title={`${item.label}: ${formatCount(item.value)} SCORMs`} aria-pressed={selected}>
              <strong>{formatCount(item.value)}</strong>
              <span className="analytics-vertical-track"><span className="analytics-vertical-bar" style={{ height: `${Math.max((item.value / maxValue) * 100, 3)}%` }} /></span>
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
  return `M 50 50 L ${start.x} ${start.y} A 46 46 0 ${endAngle - startAngle > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`;
};

function PieChart({ data, selectedValues, onToggle, total }) {
  const sliceTotal = data.reduce((sum, item) => sum + item.value, 0);
  let accumulatedAngle = 0;
  return (
    <div className="analytics-pie-layout">
      <div className="analytics-pie-wrap">
        <svg className="analytics-pie-svg" viewBox="0 0 100 100" role="img" aria-label={`Distribución de ${formatCount(total)} SCORMs filtrados por idioma`}>
          {data.length ? data.map((item, index) => {
            const startAngle = accumulatedAngle;
            const sliceAngle = sliceTotal ? (item.value / sliceTotal) * 360 : 0;
            const endAngle = accumulatedAngle + (sliceAngle >= 360 ? 359.999 : sliceAngle);
            accumulatedAngle += sliceAngle;
            const selected = selectedValues.includes(item.label);
            return <path key={item.label} d={piePath(startAngle, endAngle)} fill={PIE_COLORS[index % PIE_COLORS.length]}
              className={selected ? 'is-selected' : ''} onClick={() => onToggle(item.label)} role="button" tabIndex="0"
              aria-label={`${item.label}: ${formatCount(item.value)} SCORMs`} aria-pressed={selected}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggle(item.label); } }} />;
          }) : <circle cx="50" cy="50" r="46" fill="#e8eef7" />}
        </svg>
        <div className="analytics-pie-center"><strong>{formatCount(total)}</strong><span>SCORMs filtrados</span></div>
      </div>
      <div className="analytics-legend">
        {data.map((item, index) => {
          const selected = selectedValues.includes(item.label);
          return <button type="button" className={`analytics-legend-item${selected ? ' is-selected' : ''}`} key={item.label}
            onClick={() => onToggle(item.label)} aria-pressed={selected}>
            <span className="analytics-legend-color" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
            <span>{item.label}</span><strong>{formatCount(item.value)}</strong>
          </button>;
        })}
        {!data.length && <div className="analytics-empty-chart">No hay idiomas para los filtros actuales.</div>}
      </div>
    </div>
  );
}

function MeasureToggle({ value, onChange }) {
  return (
    <div className="analytics-measure-toggle" aria-label="Cambiar medida">
      <button type="button" className={value === 'courses' ? 'is-active' : ''} onClick={() => onChange('courses')}>Nº Cursos</button>
      <button type="button" className={value === 'scorms' ? 'is-active' : ''} onClick={() => onChange('scorms')}>Nº SCORMs</button>
    </div>
  );
}

export default function StatisticsPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [activeSection, setActiveSection] = useState('scorms');
  const [scormRows, setScormRows] = useState([]);
  const [courseRows, setCourseRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [scormFilters, setScormFilters] = useState(EMPTY_SCORM_FILTERS);
  const [courseFilters, setCourseFilters] = useState(EMPTY_COURSE_FILTERS);
  const [matterMeasure, setMatterMeasure] = useState('courses');
  const [typologyMeasure, setTypologyMeasure] = useState('courses');
  const [planMeasure, setPlanMeasure] = useState('courses');

  useEffect(() => {
    let mounted = true;
    const readStoredSession = () => {
      try {
        const storedSession = JSON.parse(globalThis?.localStorage?.getItem(SESSION_STORAGE_KEY) || 'null');
        return storedSession?.id && storedSession?.name ? storedSession : null;
      } catch (_error) { return null; }
    };
    const loadRows = async () => {
      try {
        const [scormResponse, courseResponse] = await Promise.all([
          supabase.from('scorms_master').select('id, scorm_categoria, scorm_responsable, scorm_idioma, created_at').order('id', { ascending: true }),
          supabase.from('scorms_cursos').select('*').order('id', { ascending: true }),
        ]);
        if (!mounted) return;
        setScormRows(scormResponse.data || []);
        setCourseRows(courseResponse.data || []);

        const loadErrors = [scormResponse.error?.message, courseResponse.error?.message].filter(Boolean);
        if (loadErrors.length) {
          setLoadError(`No se pudo cargar parte de la información estadística: ${loadErrors.join(' · ')}`);
        }
      } catch (_error) {
        if (mounted) setLoadError('No se pudo conectar con la vista estadística.');
      } finally { if (mounted) setLoading(false); }
    };
    const refreshServerSession = async (storedSession) => {
      try {
        const response = await fetch('/api/auth/session', { method: 'GET', credentials: 'include', cache: 'no-store' });
        const json = await response.json().catch(() => null);
        if (!mounted) return false;
        if (response.ok && json?.user) {
          const refreshed = { ...storedSession, ...json.user };
          setUserSession(refreshed);
          setAuthReady(true);
          globalThis?.localStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(refreshed));
          return true;
        }
      } catch (_error) { /* La sesión local mantiene la navegación activa. */ }
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
      if (!await refreshServerSession(null)) { if (mounted) router.replace('/'); return; }
      loadRows();
    };
    loadDashboard();
    return () => { mounted = false; };
  }, [router]);

  const scormAvailableValues = useMemo(() => Object.keys(SCORM_DIMENSIONS).reduce((result, dimension) => {
    result[dimension] = [...new Set(scormRows.flatMap((row) => scormValuesForDimension(row, dimension)))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    return result;
  }, {}), [scormRows]);

  const rowsMatchingScormFilters = (excludedDimension = '') => scormRows.filter((row) => {
    const matches = Object.keys(SCORM_DIMENSIONS).every((dimension) => dimension === excludedDimension || !scormFilters[dimension].length
      || scormValuesForDimension(row, dimension).some((value) => scormFilters[dimension].includes(value)));
    if (!matches) return false;
    const rowDate = normalizeDate(row.created_at);
    return !(scormFilters.dateFrom && (!rowDate || rowDate < scormFilters.dateFrom))
      && !(scormFilters.dateTo && (!rowDate || rowDate > scormFilters.dateTo));
  });

  const filteredScormRows = useMemo(() => rowsMatchingScormFilters(), [scormFilters, scormRows]);
  const scormChartData = useMemo(() => Object.keys(SCORM_DIMENSIONS).reduce((result, dimension) => {
    const counts = new Map();
    rowsMatchingScormFilters(dimension).forEach((row) => scormValuesForDimension(row, dimension).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1)));
    result[dimension] = [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'es'));
    return result;
  }, {}), [scormFilters, scormRows]);
  const filteredLanguageData = useMemo(() => {
    const counts = new Map();
    filteredScormRows.forEach((row) => scormValuesForDimension(row, 'language').forEach((value) => counts.set(value, (counts.get(value) || 0) + 1)));
    return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [filteredScormRows]);

  const courseModels = useMemo(() => buildCourseModels(courseRows), [courseRows]);
  const courseValues = (course, dimension) => {
    if (dimension === 'course') return [course.label];
    if (dimension === 'matter') return course.matters;
    if (dimension === 'typology') return course.typologies;
    return course.plans;
  };
  const coursesMatchingFilters = (excludedDimension = '') => courseModels.filter((course) => Object.keys(COURSE_DIMENSIONS).every((dimension) =>
    dimension === excludedDimension || !courseFilters[dimension].length || courseValues(course, dimension).some((value) => courseFilters[dimension].includes(value))));
  const filteredCourses = useMemo(() => coursesMatchingFilters(), [courseFilters, courseModels]);
  const courseAvailableValues = useMemo(() => Object.keys(COURSE_DIMENSIONS).reduce((result, dimension) => {
    result[dimension] = [...new Set(courseModels.flatMap((course) => courseValues(course, dimension)))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    return result;
  }, {}), [courseModels]);

  const buildCourseDimensionData = (dimension, measure) => {
    const groups = new Map();
    coursesMatchingFilters(dimension).forEach((course) => courseValues(course, dimension).forEach((label) => {
      if (!groups.has(label)) groups.set(label, { courses: new Set(), scorms: new Set() });
      const group = groups.get(label);
      group.courses.add(course.key);
      course.scorms.forEach((reference) => group.scorms.add(`${course.key}|${reference}`));
    }));
    return [...groups.entries()].map(([label, group]) => ({ label, value: measure === 'scorms' ? group.scorms.size : group.courses.size }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'es'));
  };

  const courseChartData = useMemo(() => ({
    course: buildCourseDimensionData('course', 'scorms'),
    matter: buildCourseDimensionData('matter', matterMeasure),
    typology: buildCourseDimensionData('typology', typologyMeasure),
    plan: buildCourseDimensionData('plan', planMeasure),
  }), [courseFilters, courseModels, matterMeasure, typologyMeasure, planMeasure]);

  const toggleScormFilter = (dimension, value) => setScormFilters((current) => ({ ...current,
    [dimension]: current[dimension].includes(value) ? current[dimension].filter((item) => item !== value) : [...current[dimension], value] }));
  const toggleCourseFilter = (dimension, value) => setCourseFilters((current) => ({ ...current,
    [dimension]: current[dimension].includes(value) ? current[dimension].filter((item) => item !== value) : [...current[dimension], value] }));
  const scormFilterCount = Object.keys(SCORM_DIMENSIONS).reduce((sum, dimension) => sum + scormFilters[dimension].length, 0) + Number(Boolean(scormFilters.dateFrom)) + Number(Boolean(scormFilters.dateTo));
  const courseFilterCount = Object.keys(COURSE_DIMENSIONS).reduce((sum, dimension) => sum + courseFilters[dimension].length, 0);

  if (!authReady) return <main className="page auth-page"><section className="card auth-card"><h1>GScormer Analytics</h1><p className={loadError ? 'status error' : 'status'}>{loadError || 'Validando sesión...'}</p></section></main>;

  return (
    <main className="page analytics-page">
      <section className="card analytics-topbar">
        <div><p className="analytics-eyebrow">GScormer · Versión {APP_VERSION}</p><h1>Vista estadística</h1><p className="status">Analiza la información y selecciona valores directamente sobre los gráficos.</p></div>
        <div className="header-actions"><button type="button" className="secondary" onClick={() => router.push('/')}>← Volver a gestión</button><span className="analytics-user"><span className="user-dot" />{userSession?.name}</span></div>
      </section>

      <section className="card analytics-workspace">
        <div className="analytics-section-tabs" role="tablist" aria-label="Secciones estadísticas">
          <button type="button" className={activeSection === 'scorms' ? 'is-active' : ''} onClick={() => setActiveSection('scorms')}>SCORMs</button>
          <button type="button" className={activeSection === 'cursos' ? 'is-active' : ''} onClick={() => setActiveSection('cursos')}>CURSOS</button>
        </div>

        {activeSection === 'scorms' ? <>
          <aside className="analytics-filter-panel" aria-label="Filtros de SCORMs">
            <div className="analytics-filter-heading"><div><span className="analytics-eyebrow">Selección activa</span><strong>{scormFilterCount ? `${scormFilterCount} filtros aplicados` : 'Todos los SCORMs'}</strong></div>
              <button type="button" className="secondary" onClick={() => setScormFilters(EMPTY_SCORM_FILTERS)} disabled={!scormFilterCount}>Quitar todos</button></div>
            <div className="analytics-filter-controls">
              {Object.entries(SCORM_DIMENSIONS).map(([dimension, config]) => <label key={dimension}>{config.label}<select value="" onChange={(event) => event.target.value && toggleScormFilter(dimension, event.target.value)}><option value="">Seleccionar valor…</option>{scormAvailableValues[dimension].map((value) => <option value={value} key={value}>{value}</option>)}</select></label>)}
              <label>Fecha desde<input type="date" value={scormFilters.dateFrom} onChange={(event) => setScormFilters((current) => ({ ...current, dateFrom: event.target.value }))} /></label>
              <label>Fecha hasta<input type="date" value={scormFilters.dateTo} onChange={(event) => setScormFilters((current) => ({ ...current, dateTo: event.target.value }))} /></label>
            </div>
            {scormFilterCount > 0 && <div className="analytics-filter-chips">
              {Object.keys(SCORM_DIMENSIONS).flatMap((dimension) => scormFilters[dimension].map((value) => <button type="button" key={`${dimension}-${value}`} onClick={() => toggleScormFilter(dimension, value)}><span>{SCORM_DIMENSIONS[dimension].label}: {value}</span><strong>×</strong></button>))}
              {scormFilters.dateFrom && <button type="button" onClick={() => setScormFilters((current) => ({ ...current, dateFrom: '' }))}><span>Desde: {scormFilters.dateFrom}</span><strong>×</strong></button>}
              {scormFilters.dateTo && <button type="button" onClick={() => setScormFilters((current) => ({ ...current, dateTo: '' }))}><span>Hasta: {scormFilters.dateTo}</span><strong>×</strong></button>}
            </div>}
          </aside>
          {loadError && <p className="status error analytics-message">{loadError}</p>}
          {loading ? <p className="status analytics-message">Cargando información estadística...</p> : <div className="analytics-grid">
            <article className="analytics-chart-card analytics-chart-wide"><header><div><span>Gráfico 1</span><h2>SCORMs por categoría</h2></div><strong>{formatCount(filteredScormRows.length)} registros</strong></header><p className="analytics-chart-help">Selecciona una barra para aplicar o quitar el filtro en toda la hoja.</p>
              <HorizontalBarChart data={scormChartData.category} selectedValues={scormFilters.category} onToggle={(value) => toggleScormFilter('category', value)} ariaLabel="SCORMs por categoría" emptyMessage="No hay categorías para los filtros actuales." unitLabel="SCORMs" /></article>
            <article className="analytics-chart-card"><header><div><span>Gráfico 2</span><h2>SCORMs por responsable</h2></div><strong>Nº SCORMs</strong></header><p className="analytics-chart-help">Desplázate horizontalmente para consultar todos los responsables.</p><VerticalBarChart data={scormChartData.responsible} selectedValues={scormFilters.responsible} onToggle={(value) => toggleScormFilter('responsible', value)} /></article>
            <article className="analytics-chart-card"><header><div><span>Gráfico 3</span><h2>SCORMs por idioma</h2></div><strong>Nº SCORMs</strong></header><p className="analytics-chart-help">El total central se actualiza con todos los filtros aplicados.</p><PieChart data={filteredLanguageData} total={filteredScormRows.length} selectedValues={scormFilters.language} onToggle={(value) => toggleScormFilter('language', value)} /></article>
          </div>}
        </> : <>
          <aside className="analytics-filter-panel" aria-label="Filtros de cursos">
            <div className="analytics-filter-heading"><div><span className="analytics-eyebrow">Selección activa</span><strong>{courseFilterCount ? `${courseFilterCount} filtros aplicados` : `${formatCount(filteredCourses.length)} cursos`}</strong></div>
              <button type="button" className="secondary" onClick={() => setCourseFilters(EMPTY_COURSE_FILTERS)} disabled={!courseFilterCount}>Quitar todos</button></div>
            <div className="analytics-filter-controls analytics-filter-controls-courses">
              {Object.entries(COURSE_DIMENSIONS).map(([dimension, config]) => <label key={dimension}>{config.label}<select value="" onChange={(event) => event.target.value && toggleCourseFilter(dimension, event.target.value)}><option value="">Seleccionar valor…</option>{courseAvailableValues[dimension].map((value) => <option value={value} key={value}>{value}</option>)}</select></label>)}
            </div>
            {courseFilterCount > 0 && <div className="analytics-filter-chips">{Object.keys(COURSE_DIMENSIONS).flatMap((dimension) => courseFilters[dimension].map((value) => <button type="button" key={`${dimension}-${value}`} onClick={() => toggleCourseFilter(dimension, value)}><span>{COURSE_DIMENSIONS[dimension].label}: {value}</span><strong>×</strong></button>))}</div>}
          </aside>
          {loadError && <p className="status error analytics-message">{loadError}</p>}
          {loading ? <p className="status analytics-message">Cargando información estadística...</p> : <div className="analytics-courses-layout">
            <div className="analytics-courses-grid">
              <article className="analytics-chart-card"><header><div><span>Gráfico 1</span><h2>SCORMs por curso</h2></div><strong>Nº SCORMs</strong></header><p className="analytics-chart-help">Cada barra representa un curso único.</p><HorizontalBarChart data={courseChartData.course} selectedValues={courseFilters.course} onToggle={(value) => toggleCourseFilter('course', value)} ariaLabel="SCORMs por curso" emptyMessage="No hay cursos para los filtros actuales." unitLabel="SCORMs" /></article>
              <article className="analytics-chart-card"><header><div><span>Gráfico 2</span><h2>Cursos por materia</h2></div><MeasureToggle value={matterMeasure} onChange={setMatterMeasure} /></header><p className="analytics-chart-help">Cambia la medida entre número de cursos y asociaciones SCORM.</p><HorizontalBarChart data={courseChartData.matter} selectedValues={courseFilters.matter} onToggle={(value) => toggleCourseFilter('matter', value)} ariaLabel="Cursos o SCORMs por materia" emptyMessage="No hay materias para los filtros actuales." unitLabel={matterMeasure === 'scorms' ? 'SCORMs' : 'Cursos'} /></article>
              <article className="analytics-chart-card"><header><div><span>Gráfico 3</span><h2>Cursos por tipología</h2></div><MeasureToggle value={typologyMeasure} onChange={setTypologyMeasure} /></header><p className="analytics-chart-help">Selecciona una tipología para filtrar todos los gráficos.</p><HorizontalBarChart data={courseChartData.typology} selectedValues={courseFilters.typology} onToggle={(value) => toggleCourseFilter('typology', value)} ariaLabel="Cursos o SCORMs por tipología" emptyMessage="No hay tipologías para los filtros actuales." unitLabel={typologyMeasure === 'scorms' ? 'SCORMs' : 'Cursos'} /></article>
            </div>
            <section className="analytics-plans-section"><div className="analytics-plans-heading"><div><span className="analytics-eyebrow">Planes de aprendizaje</span><h2>PA (Código - Nombre)</h2></div><MeasureToggle value={planMeasure} onChange={setPlanMeasure} /></div><p className="analytics-chart-help">La medida puede mostrar cursos únicos o asociaciones SCORM de cada plan.</p>
              <HorizontalBarChart data={courseChartData.plan} selectedValues={courseFilters.plan} onToggle={(value) => toggleCourseFilter('plan', value)} ariaLabel="Cursos o SCORMs por plan de aprendizaje" emptyMessage="No hay planes de aprendizaje para los filtros actuales." unitLabel={planMeasure === 'scorms' ? 'SCORMs' : 'Cursos'} /></section>
          </div>}
        </>}
      </section>
    </main>
  );
}
