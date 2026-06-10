'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_VERSION } from '../../lib/appVersion';
import { supabase } from '../../lib/supabaseClient';
import { exportRowsToExcel } from '../../lib/excelExport';

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
const ANALYTICS_STATE_STORAGE_KEY = 'gscormer_analytics_state';
const COURSE_ASSISTANT_STORAGE_KEY = 'gscormer_course_assistant_draft';
const SCORM_REFERENCE_REGEX = /(?:\b([a-z]{2,3})\s*[-_]\s*)?\b(SCR\d{4})\b/gi;

const cleanValue = (value, fallback = 'Sin informar') => String(value || '').trim() || fallback;
const formatCount = (value) => new Intl.NumberFormat('es-ES').format(value);
const normalizeText = (value) => String(value || '').trim().toLocaleUpperCase('es-ES');
const sameSelection = (left = [], right = []) => left.length === right.length && left.every((value) => right.includes(value));

const readPersistedAnalyticsState = () => {
  try {
    const storedValue = globalThis?.localStorage?.getItem(ANALYTICS_STATE_STORAGE_KEY);
    if (!storedValue) return null;
    const parsed = JSON.parse(storedValue);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (_error) {
    return null;
  }
};

const restoreFilterState = (defaults, storedFilters) => Object.keys(defaults).reduce((result, key) => {
  if (Array.isArray(defaults[key])) {
    result[key] = Array.isArray(storedFilters?.[key]) ? storedFilters[key].filter((value) => typeof value === 'string') : [];
  } else {
    result[key] = typeof storedFilters?.[key] === 'string' ? storedFilters[key] : defaults[key];
  }
  return result;
}, {});

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

const getScormReferenceCode = (reference) => normalizeText(reference).match(/(SCR\d{4})$/)?.[1] || '';

const getMasterScormReference = (row) => {
  const code = normalizeText(row.scorm_code);
  const language = normalizeText(row.scorm_idioma);
  if (!code) return '';
  return language ? `${language}-${code}` : code;
};

const collectCourseScormReferences = (courses) => {
  const references = new Set();
  courses.forEach((course) => course.scorms.forEach((reference) => {
    const normalized = normalizeText(reference);
    if (normalized) references.add(normalized);
  }));
  return references;
};

const collectMasterScormReferences = (rows) => {
  const references = new Set();
  rows.forEach((row) => {
    const reference = getMasterScormReference(row);
    if (reference) references.add(reference);
  });
  return references;
};

const courseReferenceMatchesMasterReferences = (courseReference, masterReferences) => {
  const normalized = normalizeText(courseReference);
  const code = getScormReferenceCode(normalized);
  if (!code) return false;
  if (normalized !== code) return masterReferences.has(normalized);
  return [...masterReferences].some((reference) => getScormReferenceCode(reference) === code);
};

const courseMatchesScormReferences = (course, references) => course.scorms.some((reference) =>
  courseReferenceMatchesMasterReferences(reference, references)
);

const masterScormMatchesReferences = (row, courseReferences) => {
  const masterReference = getMasterScormReference(row);
  const code = getScormReferenceCode(masterReference);
  if (!masterReference || !code) return false;
  return [...courseReferences].some((reference) => {
    const normalized = normalizeText(reference);
    return normalized === code ? true : normalized === masterReference;
  });
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
      code: cleanValue(representative.curso_codigo || representative.codigo_individual || key, 'Sin código'),
      name: cleanValue(representative.curso_nombre, 'Sin nombre'),
      instructors: [...new Set(groupedRows.flatMap((row) => String(row.curso_instructor || '').split(/[&,;|]/).map((value) => value.trim()).filter(Boolean)))],
      matters: [...matters],
      typologies: [...typologies],
      plans: [...plans],
      scorms: [...scorms],
    };
  }).sort((left, right) => left.label.localeCompare(right.label, 'es', { sensitivity: 'base' }));
};

function HorizontalBarChart({ data, selectedValues = [], onToggle, ariaLabel, emptyMessage, unitLabel, filterScope = 'scorm' }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="analytics-scroll analytics-scroll-vertical" role="list" aria-label={ariaLabel}>
      {data.map((item) => {
        const selected = selectedValues.includes(item.label);
        return (
          <button type="button" className={`analytics-horizontal-row filter-${filterScope}${selected ? ' is-selected' : ''}`} key={item.label}
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

function VerticalBarChart({ data, selectedValues, onToggle, filterScope = 'scorm' }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="analytics-scroll analytics-scroll-horizontal" aria-label="SCORMs por responsable">
      <div className="analytics-vertical-chart" style={{ minWidth: `${Math.max(data.length * 92, 520)}px` }}>
        {data.map((item) => {
          const selected = selectedValues.includes(item.label);
          return (
            <button type="button" className={`analytics-vertical-item filter-${filterScope}${selected ? ' is-selected' : ''}`} key={item.label}
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

function PieChart({ data, selectedValues, onToggle, total, filterScope = 'scorm' }) {
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
              className={`${filterScope === 'scorm' ? 'filter-scorm' : `filter-${filterScope}`}${selected ? ' is-selected' : ''}`} onClick={() => onToggle(item.label)} role="button" tabIndex="0"
              aria-label={`${item.label}: ${formatCount(item.value)} SCORMs`} aria-pressed={selected}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggle(item.label); } }} />;
          }) : <circle cx="50" cy="50" r="46" fill="#e8eef7" />}
        </svg>
        <div className="analytics-pie-center"><strong>{formatCount(total)}</strong><span>SCORMs filtrados</span></div>
      </div>
      <div className="analytics-legend">
        {data.map((item, index) => {
          const selected = selectedValues.includes(item.label);
          return <button type="button" className={`analytics-legend-item filter-${filterScope}${selected ? ' is-selected' : ''}`} key={item.label}
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

function ActiveFilterChips({ scormFilters, courseFilters, onToggleScorm, onToggleCourse, onClearDate }) {
  return (
    <div className="analytics-filter-chips">
      {Object.keys(SCORM_DIMENSIONS).flatMap((dimension) => scormFilters[dimension].map((value) => (
        <button type="button" className="filter-scorm" key={`scorm-${dimension}-${value}`} onClick={() => onToggleScorm(dimension, value)}>
          <span>{SCORM_DIMENSIONS[dimension].label}: {value}</span><strong>×</strong>
        </button>
      )))}
      {scormFilters.dateFrom && <button type="button" className="filter-scorm" onClick={() => onClearDate('dateFrom')}><span>Desde: {scormFilters.dateFrom}</span><strong>×</strong></button>}
      {scormFilters.dateTo && <button type="button" className="filter-scorm" onClick={() => onClearDate('dateTo')}><span>Hasta: {scormFilters.dateTo}</span><strong>×</strong></button>}
      {Object.keys(COURSE_DIMENSIONS).flatMap((dimension) => courseFilters[dimension].map((value) => (
        <button type="button" className={dimension === 'plan' ? 'filter-plan' : 'filter-course'} key={`course-${dimension}-${value}`} onClick={() => onToggleCourse(dimension, value)}>
          <span>{COURSE_DIMENSIONS[dimension].label}: {value}</span><strong>×</strong>
        </button>
      )))}
    </div>
  );
}

function FilteredScormList({ rows, selectedIds, onAdd, onOpenAssistant }) {
  return (
    <section className="analytics-results-section filter-scorm">
      <div className="analytics-results-heading">
        <div><span className="analytics-eyebrow">Resultado filtrado</span><h2>Lista de SCORMs</h2></div>
        <div className="analytics-results-actions">
          <strong>{formatCount(rows.length)} SCORMs</strong>
          <button type="button" onClick={onOpenAssistant}>
            Ver nuevo curso <span className="analytics-course-draft-count">{selectedIds.length}</span>
          </button>
        </div>
      </div>
      <div className="analytics-results-table-wrap">
        <table className="analytics-results-table">
          <thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Responsable</th><th>Idioma</th><th>Estado</th><th>Nuevo curso</th></tr></thead>
          <tbody>
            {rows.map((row) => {
              const selected = selectedIds.includes(row.id);
              return <tr key={row.id}>
                <td>{cleanValue(row.scorm_code, '-')}</td><td>{cleanValue(row.scorm_name, '-')}</td>
                <td>{cleanValue(row.scorm_categoria, '-')}</td><td>{cleanValue(row.scorm_responsable, '-')}</td>
                <td>{cleanValue(row.scorm_idioma, '-')}</td><td>{cleanValue(row.scorm_estado, '-')}</td>
                <td><button type="button" className={selected ? 'secondary' : ''} disabled={selected} onClick={() => onAdd(row.id)}>{selected ? 'Añadido' : 'Añadir'}</button></td>
              </tr>;
            })}
            {!rows.length && <tr><td colSpan="7" className="analytics-results-empty">No hay SCORMs compatibles con la selección actual.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilteredCourseList({ courses, compatibleScormReferences, hasScormFilters }) {
  return (
    <section className="analytics-results-section filter-course">
      <div className="analytics-results-heading">
        <div><span className="analytics-eyebrow">Resultado filtrado</span><h2>Lista de cursos</h2></div>
        <strong>{formatCount(courses.length)} cursos</strong>
      </div>
      <div className="analytics-results-table-wrap">
        <table className="analytics-results-table">
          <thead><tr><th>Código</th><th>Nombre</th><th>Materia</th><th>Tipología</th><th>Planes de aprendizaje</th><th>Nº SCORMs</th></tr></thead>
          <tbody>
            {courses.map((course) => {
              const scormCount = hasScormFilters
                ? course.scorms.filter((reference) => courseReferenceMatchesMasterReferences(reference, compatibleScormReferences)).length
                : course.scorms.length;
              return <tr key={course.key}>
                <td>{course.code}</td><td>{course.name}</td><td>{course.matters.join(', ') || '-'}</td>
                <td>{course.typologies.join(', ') || '-'}</td><td>{course.plans.join(', ') || '-'}</td><td>{formatCount(scormCount)}</td>
              </tr>;
            })}
            {!courses.length && <tr><td colSpan="6" className="analytics-results-empty">No hay cursos compatibles con la selección actual.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ChartSelectionActions({ selectedValues, appliedValues, onConfirm }) {
  const hasChanges = !sameSelection(selectedValues, appliedValues);
  return (
    <div className="analytics-chart-selection-actions">
      <span>{selectedValues.length ? `${selectedValues.length} valor${selectedValues.length === 1 ? '' : 'es'} marcado${selectedValues.length === 1 ? '' : 's'}` : 'Sin valores marcados'}</span>
      <button type="button" onClick={onConfirm} disabled={!hasChanges} aria-label="Confirmar selección del gráfico">
        <span aria-hidden="true">✓</span> Confirmar
      </button>
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
  const [persistedAnalyticsState] = useState(() => readPersistedAnalyticsState());
  const [authReady, setAuthReady] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [activeSection, setActiveSection] = useState(persistedAnalyticsState?.activeSection === 'cursos' ? 'cursos' : 'scorms');
  const [scormRows, setScormRows] = useState([]);
  const [courseRows, setCourseRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [scormFilters, setScormFilters] = useState(() => restoreFilterState(EMPTY_SCORM_FILTERS, persistedAnalyticsState?.scormFilters));
  const [courseFilters, setCourseFilters] = useState(() => restoreFilterState(EMPTY_COURSE_FILTERS, persistedAnalyticsState?.courseFilters));
  const [scormChartSelections, setScormChartSelections] = useState(() => restoreFilterState(EMPTY_SCORM_FILTERS, persistedAnalyticsState?.scormFilters));
  const [courseChartSelections, setCourseChartSelections] = useState(() => restoreFilterState(EMPTY_COURSE_FILTERS, persistedAnalyticsState?.courseFilters));
  const [matterMeasure, setMatterMeasure] = useState(persistedAnalyticsState?.matterMeasure === 'scorms' ? 'scorms' : 'courses');
  const [typologyMeasure, setTypologyMeasure] = useState(persistedAnalyticsState?.typologyMeasure === 'scorms' ? 'scorms' : 'courses');
  const [planMeasure, setPlanMeasure] = useState(persistedAnalyticsState?.planMeasure === 'scorms' ? 'scorms' : 'courses');
  const [assistantScormIds, setAssistantScormIds] = useState([]);
  const [assistantModalOpen, setAssistantModalOpen] = useState(false);
  const [assistantReorderSelection, setAssistantReorderSelection] = useState([]);
  const [draggedAssistantScormIds, setDraggedAssistantScormIds] = useState([]);
  const [assistantDropTarget, setAssistantDropTarget] = useState(null);
  const [assistantExportMessage, setAssistantExportMessage] = useState('');
  const assistantSelectionRef = useRef(null);

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
          supabase.from('scorms_master').select('id, scorm_code, scorm_name, scorm_categoria, scorm_responsable, scorm_idioma, scorm_estado, created_at').order('id', { ascending: true }),
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
        return;
      }
      if (!await refreshServerSession(null)) { if (mounted) router.replace('/'); return; }
      loadRows();
    };
    loadDashboard();
    return () => { mounted = false; };
  }, [router]);

  useEffect(() => {
    globalThis?.localStorage?.setItem(ANALYTICS_STATE_STORAGE_KEY, JSON.stringify({
      activeSection,
      scormFilters,
      courseFilters,
      matterMeasure,
      typologyMeasure,
      planMeasure,
    }));
  }, [activeSection, scormFilters, courseFilters, matterMeasure, typologyMeasure, planMeasure]);

  const scormAvailableValues = useMemo(() => Object.keys(SCORM_DIMENSIONS).reduce((result, dimension) => {
    result[dimension] = [...new Set(scormRows.flatMap((row) => scormValuesForDimension(row, dimension)))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    return result;
  }, {}), [scormRows]);

  const courseModels = useMemo(() => buildCourseModels(courseRows), [courseRows]);
  const courseValues = (course, dimension) => {
    if (dimension === 'course') return [course.label];
    if (dimension === 'matter') return course.matters;
    if (dimension === 'typology') return course.typologies;
    return course.plans;
  };

  const scormFilterCount = Object.keys(SCORM_DIMENSIONS).reduce((sum, dimension) => sum + scormFilters[dimension].length, 0)
    + Number(Boolean(scormFilters.dateFrom)) + Number(Boolean(scormFilters.dateTo));
  const courseFilterCount = Object.keys(COURSE_DIMENSIONS).reduce((sum, dimension) => sum + courseFilters[dimension].length, 0);
  const totalFilterCount = scormFilterCount + courseFilterCount;

  const rowsMatchingOwnScormFilters = (excludedDimension = '') => scormRows.filter((row) => {
    const matches = Object.keys(SCORM_DIMENSIONS).every((dimension) => dimension === excludedDimension || !scormFilters[dimension].length
      || scormValuesForDimension(row, dimension).some((value) => scormFilters[dimension].includes(value)));
    if (!matches) return false;
    const rowDate = normalizeDate(row.created_at);
    return !(scormFilters.dateFrom && (!rowDate || rowDate < scormFilters.dateFrom))
      && !(scormFilters.dateTo && (!rowDate || rowDate > scormFilters.dateTo));
  });

  const coursesMatchingOwnFilters = (excludedDimension = '') => courseModels.filter((course) => Object.keys(COURSE_DIMENSIONS).every((dimension) =>
    dimension === excludedDimension || !courseFilters[dimension].length || courseValues(course, dimension).some((value) => courseFilters[dimension].includes(value))));

  const courseFilteredReferences = useMemo(
    () => collectCourseScormReferences(coursesMatchingOwnFilters()),
    [courseFilters, courseModels]
  );
  const scormFilteredReferences = useMemo(
    () => collectMasterScormReferences(rowsMatchingOwnScormFilters()),
    [scormFilters, scormRows]
  );

  const applyCourseCompatibilityToScorms = (rows) => courseFilterCount
    ? rows.filter((row) => masterScormMatchesReferences(row, courseFilteredReferences))
    : rows;
  const applyScormCompatibilityToCourses = (courses) => scormFilterCount
    ? courses.filter((course) => courseMatchesScormReferences(course, scormFilteredReferences))
    : courses;

  const filteredScormRows = useMemo(
    () => applyCourseCompatibilityToScorms(rowsMatchingOwnScormFilters()),
    [scormFilters, courseFilters, scormRows, courseModels]
  );
  const filteredCourses = useMemo(
    () => applyScormCompatibilityToCourses(coursesMatchingOwnFilters()),
    [scormFilters, courseFilters, scormRows, courseModels]
  );

  const scormChartData = useMemo(() => Object.keys(SCORM_DIMENSIONS).reduce((result, dimension) => {
    const counts = new Map();
    applyCourseCompatibilityToScorms(rowsMatchingOwnScormFilters()).forEach((row) => {
      const values = scormValuesForDimension(row, dimension).filter((value) =>
        !scormFilters[dimension].length || scormFilters[dimension].includes(value));
      values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    });
    result[dimension] = [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'es'));
    return result;
  }, {}), [scormFilters, courseFilters, scormRows, courseModels]);

  const filteredLanguageData = useMemo(() => {
    const counts = new Map();
    filteredScormRows.forEach((row) => scormValuesForDimension(row, 'language').forEach((value) => counts.set(value, (counts.get(value) || 0) + 1)));
    return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [filteredScormRows]);

  const courseAvailableValues = useMemo(() => Object.keys(COURSE_DIMENSIONS).reduce((result, dimension) => {
    result[dimension] = [...new Set(courseModels.flatMap((course) => courseValues(course, dimension)))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    return result;
  }, {}), [courseModels]);

  const buildCourseDimensionData = (dimension, measure) => {
    const groups = new Map();
    applyScormCompatibilityToCourses(coursesMatchingOwnFilters()).forEach((course) => {
      const labels = courseValues(course, dimension).filter((label) =>
        !courseFilters[dimension].length || courseFilters[dimension].includes(label));
      labels.forEach((label) => {
        if (!groups.has(label)) groups.set(label, { courses: new Set(), scorms: new Set() });
        const group = groups.get(label);
        group.courses.add(course.key);
        course.scorms.forEach((reference) => {
          const isCompatibleScorm = !scormFilterCount || courseReferenceMatchesMasterReferences(reference, scormFilteredReferences);
          if (isCompatibleScorm) group.scorms.add(`${course.key}|${reference}`);
        });
      });
    });
    return [...groups.entries()].map(([label, group]) => ({ label, value: measure === 'scorms' ? group.scorms.size : group.courses.size }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'es'));
  };

  const courseChartData = useMemo(() => ({
    course: buildCourseDimensionData('course', 'scorms'),
    matter: buildCourseDimensionData('matter', matterMeasure),
    typology: buildCourseDimensionData('typology', typologyMeasure),
    plan: buildCourseDimensionData('plan', planMeasure),
  }), [scormFilters, courseFilters, scormRows, courseModels, matterMeasure, typologyMeasure, planMeasure]);

  const toggleSelectionValue = (currentValues, value) => currentValues.includes(value)
    ? currentValues.filter((item) => item !== value)
    : [...currentValues, value];
  const toggleScormFilter = (dimension, value) => {
    const nextSelection = toggleSelectionValue(scormFilters[dimension], value);
    setScormFilters((current) => ({ ...current, [dimension]: nextSelection }));
    setScormChartSelections((current) => ({ ...current, [dimension]: nextSelection }));
  };
  const toggleCourseFilter = (dimension, value) => {
    const nextSelection = toggleSelectionValue(courseFilters[dimension], value);
    setCourseFilters((current) => ({ ...current, [dimension]: nextSelection }));
    setCourseChartSelections((current) => ({ ...current, [dimension]: nextSelection }));
  };
  const toggleScormChartSelection = (dimension, value) => setScormChartSelections((current) => ({
    ...current, [dimension]: toggleSelectionValue(current[dimension], value),
  }));
  const toggleCourseChartSelection = (dimension, value) => setCourseChartSelections((current) => ({
    ...current, [dimension]: toggleSelectionValue(current[dimension], value),
  }));
  const confirmScormChartSelection = (dimension) => setScormFilters((current) => ({
    ...current, [dimension]: [...scormChartSelections[dimension]],
  }));
  const confirmCourseChartSelection = (dimension) => setCourseFilters((current) => ({
    ...current, [dimension]: [...courseChartSelections[dimension]],
  }));
  const clearAllFilters = () => {
    setScormFilters(EMPTY_SCORM_FILTERS);
    setCourseFilters(EMPTY_COURSE_FILTERS);
    setScormChartSelections(EMPTY_SCORM_FILTERS);
    setCourseChartSelections(EMPTY_COURSE_FILTERS);
  };
  const clearScormDateFilter = (field) => setScormFilters((current) => ({ ...current, [field]: '' }));

  const assistantSelectedRows = useMemo(() => assistantScormIds
    .map((id) => scormRows.find((row) => row.id === id))
    .filter(Boolean), [assistantScormIds, scormRows]);

  useEffect(() => {
    if (!assistantModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [assistantModalOpen]);

  const addAssistantScorm = (scormId) => setAssistantScormIds((current) => current.includes(scormId) ? current : [...current, scormId]);
  const removeAssistantScorm = (scormId) => {
    setAssistantScormIds((current) => current.filter((id) => id !== scormId));
    setAssistantReorderSelection((current) => current.filter((id) => id !== scormId));
    setAssistantExportMessage('');
  };
  const toggleAssistantReorderSelection = (scormId) => setAssistantReorderSelection((current) => current.includes(scormId)
    ? current.filter((id) => id !== scormId)
    : [...current, scormId]);
  const selectAllAssistantScorms = () => setAssistantReorderSelection(
    assistantReorderSelection.length === assistantScormIds.length ? [] : [...assistantScormIds],
  );
  const moveSelectedAssistantScorms = (destination) => {
    if (!assistantReorderSelection.length) return;
    const selectedSet = new Set(assistantReorderSelection);
    setAssistantScormIds((current) => {
      const selected = current.filter((id) => selectedSet.has(id));
      const remaining = current.filter((id) => !selectedSet.has(id));
      return destination === 'top' ? [...selected, ...remaining] : [...remaining, ...selected];
    });
  };
  const startAssistantDrag = (event, scormId) => {
    const idsToDrag = assistantReorderSelection.includes(scormId)
      ? assistantScormIds.filter((id) => assistantReorderSelection.includes(id))
      : [scormId];
    if (!assistantReorderSelection.includes(scormId)) setAssistantReorderSelection([scormId]);
    event.dataTransfer.setData('text/plain', JSON.stringify(idsToDrag));
    event.dataTransfer.effectAllowed = 'move';
    setDraggedAssistantScormIds(idsToDrag);
    setAssistantExportMessage('');
  };
  const updateAssistantDropTarget = (event, targetId) => {
    event.preventDefault();
    if (draggedAssistantScormIds.includes(targetId)) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < bounds.top + (bounds.height / 2) ? 'before' : 'after';
    setAssistantDropTarget((current) => current?.id === targetId && current?.position === position ? current : { id: targetId, position });
    event.dataTransfer.dropEffect = 'move';
  };
  const dropAssistantScorms = (event, targetId) => {
    event.preventDefault();
    let transferredIds = [];
    try { transferredIds = JSON.parse(event.dataTransfer.getData('text/plain') || '[]'); } catch (_error) { transferredIds = []; }
    const idsToMove = (transferredIds.length ? transferredIds : draggedAssistantScormIds).filter((id) => assistantScormIds.includes(id));
    if (!idsToMove.length || idsToMove.includes(targetId)) return;
    const position = assistantDropTarget?.id === targetId ? assistantDropTarget.position : 'before';
    const movingSet = new Set(idsToMove);
    setAssistantScormIds((current) => {
      const moving = current.filter((id) => movingSet.has(id));
      const remaining = current.filter((id) => !movingSet.has(id));
      const targetIndex = remaining.indexOf(targetId);
      const insertionIndex = targetIndex < 0 ? remaining.length : targetIndex + (position === 'after' ? 1 : 0);
      return [...remaining.slice(0, insertionIndex), ...moving, ...remaining.slice(insertionIndex)];
    });
    setAssistantDropTarget(null);
    setDraggedAssistantScormIds([]);
  };
  const finishAssistantDrag = () => {
    setDraggedAssistantScormIds([]);
    setAssistantDropTarget(null);
  };
  const scrollAssistantSelectionDuringDrag = (event) => {
    if (!draggedAssistantScormIds.length || !assistantSelectionRef.current) return;
    assistantSelectionRef.current.scrollTop += event.deltaY;
    event.preventDefault();
  };
  const autoScrollAssistantSelection = (event) => {
    if (!draggedAssistantScormIds.length || !assistantSelectionRef.current) return;
    const bounds = assistantSelectionRef.current.getBoundingClientRect();
    const edgeSize = 56;
    if (event.clientY < bounds.top + edgeSize) assistantSelectionRef.current.scrollTop -= 14;
    if (event.clientY > bounds.bottom - edgeSize) assistantSelectionRef.current.scrollTop += 14;
  };
  const exportSelectedAssistantScorms = () => {
    const selectedSet = new Set(assistantReorderSelection);
    const rowsToExport = assistantSelectedRows
      .map((row, index) => ({ row, order: index + 1 }))
      .filter(({ row }) => selectedSet.has(row.id))
      .map(({ row, order }) => ({
        Orden: order,
        Código: cleanValue(row.scorm_code, ''),
        Nombre: cleanValue(row.scorm_name, ''),
        Categoría: cleanValue(row.scorm_categoria, ''),
        Responsable: cleanValue(row.scorm_responsable, ''),
        Idioma: cleanValue(row.scorm_idioma, ''),
        Estado: cleanValue(row.scorm_estado, ''),
      }));
    const exported = exportRowsToExcel({
      rows: rowsToExport,
      preferredKeys: ['Orden', 'Código', 'Nombre', 'Categoría', 'Responsable', 'Idioma', 'Estado'],
      sheetName: 'scorms_seleccionados',
      fileName: `scorms_seleccionados_${new Date().toISOString().slice(0, 10)}.xls`,
    });
    setAssistantExportMessage(exported
      ? `Listado exportado correctamente (${rowsToExport.length} SCORM${rowsToExport.length === 1 ? '' : 's'}).`
      : 'Selecciona al menos un SCORM para exportar el listado.');
  };
  const sendAssistantCourseToValidation = () => {
    if (!assistantScormIds.length) return;
    globalThis?.localStorage?.setItem(COURSE_ASSISTANT_STORAGE_KEY, JSON.stringify({
      scormIds: assistantScormIds,
      courseStatus: 'Pendiente de validación',
      createdAt: new Date().toISOString(),
    }));
    router.push('/?view=cursos&courseAssistant=1');
  };

  if (!authReady) return <main className="page auth-page"><section className="card auth-card"><h1>GScormer Analytics</h1><p className={loadError ? 'status error' : 'status'}>{loadError || 'Validando sesión...'}</p></section></main>;

  return (
    <main className="page analytics-page">
      <section className="card analytics-topbar">
        <div><p className="analytics-eyebrow">GScormer · Versión {APP_VERSION}</p><h1>Vista estadística</h1><p className="status">Los filtros se mantienen y cruzan automáticamente entre SCORMs, cursos y planes de aprendizaje.</p></div>
        <div className="header-actions"><button type="button" className="secondary" onClick={() => router.push('/')}>← Volver a gestión</button><span className="analytics-user"><span className="user-dot" />{userSession?.name}</span></div>
      </section>

      <section className="card analytics-workspace">
        <div className="analytics-section-tabs" role="tablist" aria-label="Secciones estadísticas">
          <button type="button" className={activeSection === 'scorms' ? 'is-active' : ''} onClick={() => setActiveSection('scorms')}>SCORMs</button>
          <button type="button" className={activeSection === 'cursos' ? 'is-active' : ''} onClick={() => setActiveSection('cursos')}>CURSOS</button>
        </div>

        {activeSection === 'scorms' ? <>
          <aside className="analytics-filter-panel" aria-label="Filtros de SCORMs">
            <div className="analytics-filter-heading"><div><span className="analytics-eyebrow">Selección asociativa</span><strong>{totalFilterCount ? `${totalFilterCount} filtros aplicados en SCORMs, cursos o PA` : 'Todos los SCORMs'}</strong></div>
              <button type="button" className="secondary" onClick={clearAllFilters} disabled={!totalFilterCount}>Quitar todos</button></div>
            <div className="analytics-filter-controls">
              {Object.entries(SCORM_DIMENSIONS).map(([dimension, config]) => <label key={dimension}>{config.label}<select value="" onChange={(event) => event.target.value && toggleScormFilter(dimension, event.target.value)}><option value="">Seleccionar valor…</option>{scormAvailableValues[dimension].map((value) => <option value={value} key={value}>{value}</option>)}</select></label>)}
              <label>Fecha desde<input type="date" value={scormFilters.dateFrom} onChange={(event) => setScormFilters((current) => ({ ...current, dateFrom: event.target.value }))} /></label>
              <label>Fecha hasta<input type="date" value={scormFilters.dateTo} onChange={(event) => setScormFilters((current) => ({ ...current, dateTo: event.target.value }))} /></label>
            </div>
            {totalFilterCount > 0 && <ActiveFilterChips scormFilters={scormFilters} courseFilters={courseFilters}
              onToggleScorm={toggleScormFilter} onToggleCourse={toggleCourseFilter} onClearDate={clearScormDateFilter} />}
          </aside>
          {loadError && <p className="status error analytics-message">{loadError}</p>}
          {loading ? <p className="status analytics-message">Cargando información estadística...</p> : <div className="analytics-grid">
            <article className="analytics-chart-card analytics-chart-wide"><header><div><span>Gráfico 1</span><h2>SCORMs por categoría</h2></div><strong>{formatCount(filteredScormRows.length)} registros</strong></header><p className="analytics-chart-help">Marca una o varias barras y confirma la selección para filtrar toda la hoja.</p>
              <ChartSelectionActions selectedValues={scormChartSelections.category} appliedValues={scormFilters.category} onConfirm={() => confirmScormChartSelection('category')} />
              <HorizontalBarChart data={scormChartData.category} selectedValues={scormChartSelections.category} onToggle={(value) => toggleScormChartSelection('category', value)} ariaLabel="SCORMs por categoría" emptyMessage="No hay categorías para los filtros actuales." unitLabel="SCORMs" /></article>
            <article className="analytics-chart-card"><header><div><span>Gráfico 2</span><h2>SCORMs por responsable</h2></div><strong>Nº SCORMs</strong></header><p className="analytics-chart-help">Marca varios responsables y confirma con el check para aplicar el filtro.</p><ChartSelectionActions selectedValues={scormChartSelections.responsible} appliedValues={scormFilters.responsible} onConfirm={() => confirmScormChartSelection('responsible')} /><VerticalBarChart data={scormChartData.responsible} selectedValues={scormChartSelections.responsible} onToggle={(value) => toggleScormChartSelection('responsible', value)} /></article>
            <article className="analytics-chart-card"><header><div><span>Gráfico 3</span><h2>SCORMs por idioma</h2></div><strong>Nº SCORMs</strong></header><p className="analytics-chart-help">Marca uno o varios idiomas; el total se actualizará al confirmar.</p><ChartSelectionActions selectedValues={scormChartSelections.language} appliedValues={scormFilters.language} onConfirm={() => confirmScormChartSelection('language')} /><PieChart data={filteredLanguageData} total={filteredScormRows.length} selectedValues={scormChartSelections.language} onToggle={(value) => toggleScormChartSelection('language', value)} /></article>
            <FilteredScormList rows={filteredScormRows} selectedIds={assistantScormIds} onAdd={addAssistantScorm} onOpenAssistant={() => setAssistantModalOpen(true)} />
          </div>}
        </> : <>
          <aside className="analytics-filter-panel" aria-label="Filtros de cursos">
            <div className="analytics-filter-heading"><div><span className="analytics-eyebrow">Selección asociativa</span><strong>{totalFilterCount ? `${totalFilterCount} filtros aplicados en SCORMs, cursos o PA` : `${formatCount(filteredCourses.length)} cursos`}</strong></div>
              <button type="button" className="secondary" onClick={clearAllFilters} disabled={!totalFilterCount}>Quitar todos</button></div>
            <div className="analytics-filter-controls analytics-filter-controls-courses">
              {Object.entries(COURSE_DIMENSIONS).map(([dimension, config]) => <label key={dimension}>{config.label}<select value="" onChange={(event) => event.target.value && toggleCourseFilter(dimension, event.target.value)}><option value="">Seleccionar valor…</option>{courseAvailableValues[dimension].map((value) => <option value={value} key={value}>{value}</option>)}</select></label>)}
            </div>
            {totalFilterCount > 0 && <ActiveFilterChips scormFilters={scormFilters} courseFilters={courseFilters}
              onToggleScorm={toggleScormFilter} onToggleCourse={toggleCourseFilter} onClearDate={clearScormDateFilter} />}
          </aside>
          {loadError && <p className="status error analytics-message">{loadError}</p>}
          {loading ? <p className="status analytics-message">Cargando información estadística...</p> : <div className="analytics-courses-layout">
            <div className="analytics-courses-grid">
              <article className="analytics-chart-card"><header><div><span>Gráfico 1</span><h2>SCORMs por curso</h2></div><strong>Nº SCORMs</strong></header><p className="analytics-chart-help">Marca uno o varios cursos y confirma la selección.</p><ChartSelectionActions selectedValues={courseChartSelections.course} appliedValues={courseFilters.course} onConfirm={() => confirmCourseChartSelection('course')} /><HorizontalBarChart data={courseChartData.course} selectedValues={courseChartSelections.course} onToggle={(value) => toggleCourseChartSelection('course', value)} ariaLabel="SCORMs por curso" emptyMessage="No hay cursos para los filtros actuales." unitLabel="SCORMs" filterScope="course" /></article>
              <article className="analytics-chart-card"><header><div><span>Gráfico 2</span><h2>Cursos por materia</h2></div><MeasureToggle value={matterMeasure} onChange={setMatterMeasure} /></header><p className="analytics-chart-help">Cambia la medida, marca varias materias y confirma la selección.</p><ChartSelectionActions selectedValues={courseChartSelections.matter} appliedValues={courseFilters.matter} onConfirm={() => confirmCourseChartSelection('matter')} /><HorizontalBarChart data={courseChartData.matter} selectedValues={courseChartSelections.matter} onToggle={(value) => toggleCourseChartSelection('matter', value)} ariaLabel="Cursos o SCORMs por materia" emptyMessage="No hay materias para los filtros actuales." unitLabel={matterMeasure === 'scorms' ? 'SCORMs' : 'Cursos'} filterScope="course" /></article>
              <article className="analytics-chart-card"><header><div><span>Gráfico 3</span><h2>Cursos por tipología</h2></div><MeasureToggle value={typologyMeasure} onChange={setTypologyMeasure} /></header><p className="analytics-chart-help">Marca una o varias tipologías y confirma para filtrar todos los gráficos.</p><ChartSelectionActions selectedValues={courseChartSelections.typology} appliedValues={courseFilters.typology} onConfirm={() => confirmCourseChartSelection('typology')} /><HorizontalBarChart data={courseChartData.typology} selectedValues={courseChartSelections.typology} onToggle={(value) => toggleCourseChartSelection('typology', value)} ariaLabel="Cursos o SCORMs por tipología" emptyMessage="No hay tipologías para los filtros actuales." unitLabel={typologyMeasure === 'scorms' ? 'SCORMs' : 'Cursos'} filterScope="course" /></article>
            </div>
            <section className="analytics-plans-section"><div className="analytics-plans-heading"><div><span className="analytics-eyebrow">Planes de aprendizaje</span><h2>PA (Código - Nombre)</h2></div><MeasureToggle value={planMeasure} onChange={setPlanMeasure} /></div><p className="analytics-chart-help">Elige la medida, marca varios planes y confirma la selección.</p>
              <ChartSelectionActions selectedValues={courseChartSelections.plan} appliedValues={courseFilters.plan} onConfirm={() => confirmCourseChartSelection('plan')} />
              <HorizontalBarChart data={courseChartData.plan} selectedValues={courseChartSelections.plan} onToggle={(value) => toggleCourseChartSelection('plan', value)} ariaLabel="Cursos o SCORMs por plan de aprendizaje" emptyMessage="No hay planes de aprendizaje para los filtros actuales." unitLabel={planMeasure === 'scorms' ? 'SCORMs' : 'Cursos'} filterScope="plan" /></section>
            <FilteredCourseList courses={filteredCourses} compatibleScormReferences={scormFilteredReferences} hasScormFilters={Boolean(scormFilterCount)} />
          </div>}
        </>}
      </section>

      {assistantModalOpen ? (
        <div className="modal-overlay course-assistant-modal-overlay" role="presentation">
          <section className="modal-content modal-content-large course-assistant-modal" role="dialog" aria-modal="true" aria-labelledby="course-assistant-title">
            <div className="modal-header">
              <div>
                <span className="analytics-eyebrow">Curso hipotético</span>
                <h3 id="course-assistant-title">SCORMs del nuevo curso</h3>
                <p className="status">Reordena los SCORMs antes de abrir el formulario de creación del curso.</p>
              </div>
              <button type="button" className="secondary" onClick={() => setAssistantModalOpen(false)}>Cerrar</button>
            </div>

            <div className="course-assistant-modal-summary">
              <strong>{assistantSelectedRows.length} SCORMs añadidos · {assistantReorderSelection.length} seleccionados</strong>
              <span>Selecciona varios y arrastra cualquiera de ellos. La línea azul indica la posición de destino.</span>
            </div>

            <div className="course-assistant-toolbar" aria-label="Acciones sobre los SCORMs seleccionados">
              <button type="button" className="secondary" disabled={!assistantScormIds.length} onClick={selectAllAssistantScorms}>
                {assistantReorderSelection.length === assistantScormIds.length && assistantScormIds.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
              <button type="button" className="secondary" disabled={!assistantReorderSelection.length} onClick={() => moveSelectedAssistantScorms('top')}>↑ Enviar arriba</button>
              <button type="button" className="secondary" disabled={!assistantReorderSelection.length} onClick={() => moveSelectedAssistantScorms('bottom')}>↓ Enviar abajo</button>
              <button type="button" disabled={!assistantReorderSelection.length} onClick={exportSelectedAssistantScorms}>Exportar listado SCORMs</button>
            </div>

            <ol ref={assistantSelectionRef} className="course-assistant-selection" onWheel={scrollAssistantSelectionDuringDrag} onDragOver={autoScrollAssistantSelection}>
              {assistantSelectedRows.map((row, index) => {
                const selected = assistantReorderSelection.includes(row.id);
                const dragging = draggedAssistantScormIds.includes(row.id);
                const dropPosition = assistantDropTarget?.id === row.id ? assistantDropTarget.position : '';
                return <li key={`selected-${row.id}`} draggable onDragStart={(event) => startAssistantDrag(event, row.id)} onDragEnd={finishAssistantDrag} onDragOver={(event) => updateAssistantDropTarget(event, row.id)} onDrop={(event) => dropAssistantScorms(event, row.id)} className={[selected ? 'is-selected' : '', dragging ? 'is-dragging' : '', dropPosition ? `is-drop-${dropPosition}` : ''].filter(Boolean).join(' ')}>
                  <label className="course-assistant-check" title="Seleccionar para mover o exportar">
                    <input type="checkbox" checked={selected} onChange={() => toggleAssistantReorderSelection(row.id)} aria-label={`Seleccionar ${cleanValue(row.scorm_name, 'SCORM')}`} />
                  </label>
                  <span className="course-assistant-order">{index + 1}</span>
                  <span className="course-assistant-drag" aria-hidden="true">⋮⋮</span>
                  <div><strong>{getMasterScormReference(row) || cleanValue(row.scorm_code, '-')}</strong><span>{cleanValue(row.scorm_categoria, '-')}</span><p>{cleanValue(row.scorm_name, '-')}</p></div>
                  <button type="button" className="secondary" onClick={() => removeAssistantScorm(row.id)} aria-label={`Quitar ${cleanValue(row.scorm_name, 'SCORM')}`}>Quitar</button>
                </li>;
              })}
            </ol>
            {!assistantSelectedRows.length && <div className="course-assistant-empty">Añade SCORMs desde la tabla de resultados filtrados.</div>}
            {assistantExportMessage ? <p className="course-assistant-export-message" role="status">{assistantExportMessage}</p> : null}

            <footer className="modal-footer course-assistant-actions">
              <button type="button" className="secondary" disabled={!assistantScormIds.length} onClick={() => { setAssistantScormIds([]); setAssistantReorderSelection([]); setAssistantExportMessage(''); }}>Vaciar selección</button>
              <button type="button" disabled={!assistantScormIds.length} onClick={sendAssistantCourseToValidation}>Pasar a validar</button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
