'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { APP_VERSION } from '../lib/appVersion';

const columns = [
  { key: 'scorm_idioma', label: 'Idioma', editable: true },
  { key: 'scorm_code', label: 'Código', editable: true },
  { key: 'scorm_name', label: 'Nombre', editable: true },
  { key: 'scorm_responsable', label: 'Responsable', editable: true },
  { key: 'scorm_tipo', label: 'Tipo', editable: true },
  { key: 'scorm_categoria', label: 'Categoría', editable: true },
  { key: 'scorm_subcategoria', label: 'Subcategoría', editable: true },
  { key: 'scorm_url', label: 'URL', editable: true },
  { key: 'scorm_estado', label: 'Estado', editable: true },
  { key: 'scorm_test', label: 'Test', editable: true },
  { key: 'scorm_etiquetas', label: 'CURSOS', editable: false },
];

const FILTER_LAYOUT_ROWS = [
  ['scorm_code', 'scorm_name'],
  ['scorm_responsable', 'scorm_categoria', 'scorm_estado', 'scorm_test', 'scorm_idioma'],
];

const FILTER_SELECT_KEYS = ['scorm_responsable', 'scorm_categoria', 'scorm_estado', 'scorm_test', 'scorm_idioma'];

const FILTER_LABELS = {
  scorm_categoria: 'Clasificación',
};

const publishColumns = [
  ...columns.filter((column) => !['scorm_subcategoria', 'scorm_etiquetas'].includes(column.key)),
  { key: 'publication_update_type', label: 'Tipo de actualización', editable: false },
  { key: 'publication_date', label: 'Fecha', editable: false },
];

const alertColumns = [
  { key: 'scorm_idioma', label: 'Idioma' },
  { key: 'scorm_code', label: 'Código' },
  { key: 'scorm_name', label: 'Nombre' },
  { key: 'scorm_responsable', label: 'Responsable' },
  { key: 'scorm_categoria', label: 'Categoría' },
  { key: 'scorm_estado', label: 'Estado' },
  { key: 'scorms_alerta', label: 'Fecha alerta' },
];

const editableColumns = columns.filter((column) => column.editable).map((column) => column.key);

const STATUS_ORDER = ['En proceso', 'Pendiente de publicar', 'Publicado', 'Actualizado pendiente de publicar'];
const DEFAULT_LANGUAGES = ['ES', 'CAT', 'PT', 'GAL', 'IT'];
const LANGUAGE_LABELS = {
  ES: 'Español',
  CAT: 'Catalán',
  PT: 'Portugués',
  GAL: 'Gallego',
  IT: 'Italiano',
};
const UPDATE_TYPES = [
  'Cambios menores',
  'Cambio de estructura',
  'Actualización de imágenes',
  'Actualización de storyline',
];
const PUBLISH_PENDING_STATES = ['Pendiente de publicar', 'Actualizado pendiente de publicar'];
const SCORM_CODE_REGEX = /(?:\b([a-z]{2,3})\s*[-_]\s*)?\b(SCR\d{4})\b/gi;

const normalizeLanguage = (language) => {
  const normalized = String(language || '').trim().toUpperCase();

  if (normalized === 'CA') {
    return 'CAT';
  }

  return normalized;
};

const CATEGORY_COLORS = {
  '02-Gestión Documental y Archivo': {
    backgroundColor: '#eef4ff',
    borderColor: '#c4d8ff',
    color: '#2456a8',
  },
  '00-Configuración General': {
    backgroundColor: '#f4efff',
    borderColor: '#d8c5ff',
    color: '#59329f',
  },
  '01-Atención Ciudadana': {
    backgroundColor: '#edfff8',
    borderColor: '#bfeeda',
    color: '#156a4a',
  },
  '04-Gestión Económica': {
    backgroundColor: '#fff6eb',
    borderColor: '#ffd7ad',
    color: '#915515',
  },
  '05-Escritorio de tramitación': {
    backgroundColor: '#ffeef2',
    borderColor: '#ffc8d5',
    color: '#983351',
  },
  '06-Gestiona Code': {
    backgroundColor: '#ebfbff',
    borderColor: '#bceef8',
    color: '#13657a',
  },
  '03-Analiza': {
    backgroundColor: '#f5f8e9',
    borderColor: '#d9e8af',
    color: '#576d13',
  },
};

const getCategoryColor = (category) => {
  return (
    CATEGORY_COLORS[category] || {
      backgroundColor: '#f2f5fb',
      borderColor: '#d4deef',
      color: '#415a80',
    }
  );
};

const getRowState = (row) => row.scorm_estado || 'Sin estado';

const getOfficialName = (row) => String(row.scorm_name || row.scorm_nombre || '').trim() || 'Sin nombre oficial';

const getInternationalizedCode = (row) => {
  const idioma = normalizeLanguage(row.scorm_idioma);
  const codigo = String(row.scorm_code || '').trim();

  if (!idioma && !codigo) {
    return 'Sin código internacionalizado';
  }

  if (!idioma) {
    return codigo;
  }

  if (!codigo) {
    return idioma;
  }

  return `${idioma}-${codigo}`;
};

const getNextAvailableScormCode = (rows) => {
  const usedNumbers = rows.reduce((acc, row) => {
    const code = String(row.scorm_code || '').trim().toUpperCase();
    const match = code.match(/^SCR(\d+)$/);

    if (match) {
      acc.push(Number(match[1]));
    }

    return acc;
  }, []);

  const lastNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0;
  const nextNumber = lastNumber + 1;

  return `SCR${String(nextNumber).padStart(4, '0')}`;
};

const getDateMsFromCandidates = (candidates) => {
  for (const candidate of candidates.filter(Boolean)) {
    const parsed = new Date(candidate).getTime();
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

const getRowDateMs = (row) => {
  const candidates = [row.updated_at, row.created_at, row.fecha_modif];

  return getDateMsFromCandidates(candidates);
};

const getPublicationDateMs = (row, latestUpdateByCode = {}) => {
  const rowState = getRowState(row);
  const normalizedCode = String(row.scorm_code || '').trim().toUpperCase();
  const latestUpdateDate = normalizedCode ? latestUpdateByCode[normalizedCode] : null;

  if (rowState === 'Actualizado pendiente de publicar') {
    return getDateMsFromCandidates([latestUpdateDate, row.fecha_modif, row.updated_at, row.created_at]);
  }

  if (rowState === 'Pendiente de publicar') {
    return getDateMsFromCandidates([row.created_at, row.updated_at]);
  }

  return getRowDateMs(row);
};

const getPublicationUpdateType = (row, latestUpdateByCode = {}) => {
  const rowState = getRowState(row);

  if (rowState === 'Pendiente de publicar') {
    return 'Nueva publicación';
  }

  if (rowState === 'Actualizado pendiente de publicar') {
    const normalizedCode = String(row.scorm_code || '').trim().toUpperCase();
    const latestUpdate = normalizedCode ? latestUpdateByCode[normalizedCode] : null;

    return latestUpdate?.cambio_tipo || 'Sin tipo de cambio';
  }

  return '-';
};

const formatDateDDMMYYYY = (value) => {
  const dateMs = typeof value === 'number' ? value : getDateMsFromCandidates([value]);
  if (!dateMs) {
    return '-';
  }

  return new Date(dateMs).toLocaleDateString('es-ES');
};

const getScormTestDisplay = (value) => {
  const normalizedValue = String(value || '').trim();
  const isPositive = normalizedValue.toLowerCase() === 'sí' || normalizedValue.toLowerCase() === 'si';

  if (!normalizedValue) {
    return {
      value: '-',
      isPositive: false,
    };
  }

  return {
    value: normalizedValue,
    isPositive,
  };
};

const extractScormReferencesFromContenido = (contenido) => {
  const references = [];
  const source = String(contenido || '');
  SCORM_CODE_REGEX.lastIndex = 0;
  let match = SCORM_CODE_REGEX.exec(source);

  while (match) {
    references.push({
      language: String(match[1] || '').trim().toUpperCase(),
      code: String(match[2] || '').trim().toUpperCase(),
    });
    match = SCORM_CODE_REGEX.exec(source);
  }

  return references;
};

const formatFieldLabel = (key) =>
  String(key || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getIndividualCourseIdentity = (course) => {
  const codigoIndividual = String(course.codigo_individual || '').trim();
  if (codigoIndividual) {
    return {
      key: `individual-${codigoIndividual.toUpperCase()}`,
      label: codigoIndividual,
    };
  }

  const codigoCurso = String(course.curso_codigo || '').trim();
  if (codigoCurso) {
    return {
      key: `curso-${codigoCurso.toUpperCase()}`,
      label: codigoCurso,
    };
  }

  const nombreCurso = String(course.curso_nombre || '').trim();
  if (nombreCurso) {
    return {
      key: `nombre-${nombreCurso.toUpperCase()}`,
      label: nombreCurso,
    };
  }

  return {
    key: `fila-${course.id}`,
    label: `Sin código individual (${course.id})`,
  };
};

const parseResponsables = (responsablesValue) => {
  return String(responsablesValue || '')
    .split('&')
    .map((value) => value.trim())
    .filter(Boolean);
};

const normalizeAgentLabel = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
};

const rowHasResponsibleAgents = (row, agentNames = []) => {
  const normalizedAgents = agentNames.map((agentName) => normalizeAgentLabel(agentName)).filter(Boolean);
  if (normalizedAgents.length === 0) {
    return false;
  }

  const normalizedResponsables = parseResponsables(row.scorm_responsable).map((responsable) => normalizeAgentLabel(responsable));

  return normalizedAgents.some((normalizedAgent) => {
    const exactMatch = normalizedResponsables.some((responsable) => responsable === normalizedAgent);
    if (exactMatch) {
      return true;
    }

    return normalizedResponsables.some((responsable) => responsable.includes(normalizedAgent));
  });
};

export default function ScormsTable({ userSession }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [activeRow, setActiveRow] = useState(null);
  const [detailDraft, setDetailDraft] = useState(null);
  const [filterInputs, setFilterInputs] = useState({});
  const [filters, setFilters] = useState({});
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedCardIds, setExpandedCardIds] = useState([]);
  const [dragOverState, setDragOverState] = useState('');
  const [draggedRowIds, setDraggedRowIds] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const [translationPreset, setTranslationPreset] = useState('todos');
  const [pendingLanguage, setPendingLanguage] = useState('ES');
  const [translationModalOpen, setTranslationModalOpen] = useState(false);
  const [translationSubmitting, setTranslationSubmitting] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState('CAT');
  const [selectedTranslationGroupIds, setSelectedTranslationGroupIds] = useState([]);
  const [translationNameDrafts, setTranslationNameDrafts] = useState({});
  const [updateTargetRow, setUpdateTargetRow] = useState(null);
  const [updateTargetRows, setUpdateTargetRows] = useState([]);
  const [updateForm, setUpdateForm] = useState({
    cambio_tipo: '',
    fecha_modif: new Date().toISOString().slice(0, 10),
    cambio_user: '',
    cambio_notas: '',
  });
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [createDraft, setCreateDraft] = useState(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [publishPreset, setPublishPreset] = useState('todos');
  const [latestUpdateByCode, setLatestUpdateByCode] = useState({});
  const [publishDateSortDirection, setPublishDateSortDirection] = useState('desc');
  const [coursesRows, setCoursesRows] = useState([]);
  const [coursesModalRow, setCoursesModalRow] = useState(null);
  const [myScormsOnly, setMyScormsOnly] = useState(false);
  const scopedResponsibleAgents = userSession?.agentFilters?.responsables || [];
  const canPublishAsAdmin = userSession?.admin === true;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    const [masterResponse, updatesResponse, cursosResponse] = await Promise.all([
      supabase.from('scorms_master').select('*').order('id', { ascending: true }),
      supabase.from('scorms_actualizacion').select('scorm_codigo, cambio_tipo, fecha_modif, created_at'),
      supabase.from('scorms_cursos').select('*').order('id', { ascending: true }),
    ]);

    if (masterResponse.error) {
      setError(`No se pudieron cargar los datos: ${masterResponse.error.message}`);
      setRows([]);
      setLatestUpdateByCode({});
      setLoading(false);
      return;
    }

    if (updatesResponse.error) {
      setError(`No se pudieron cargar las fechas de actualización: ${updatesResponse.error.message}`);
      setLatestUpdateByCode({});
    } else {
      const latestDatesByCode = (updatesResponse.data || []).reduce((acc, item) => {
        const code = String(item.scorm_codigo || '').trim().toUpperCase();
        if (!code) {
          return acc;
        }

        const dateMs = getDateMsFromCandidates([item.fecha_modif, item.created_at]);
        if (!dateMs) {
          return acc;
        }

        if (!acc[code] || dateMs > acc[code].dateMs) {
          acc[code] = {
            raw: item.fecha_modif || item.created_at,
            dateMs,
            cambio_tipo: item.cambio_tipo,
          };
        }

        return acc;
      }, {});

      setLatestUpdateByCode(latestDatesByCode);
    }

    if (cursosResponse.error) {
      setCoursesRows([]);
      setError((previous) => previous || `No se pudieron cargar los cursos relacionados: ${cursosResponse.error.message}`);
    } else {
      setCoursesRows(cursosResponse.data || []);
    }

    setRows(masterResponse.data || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesMyScorms = !myScormsOnly || rowHasResponsibleAgents(row, scopedResponsibleAgents);
      if (!matchesMyScorms) {
        return false;
      }

      return columns.every((column) => {
        const fieldFilters = filters[column.key] || [];
        if (fieldFilters.length === 0) {
          return true;
        }

        const value =
          column.key === 'scorm_name'
            ? getOfficialName(row).toLowerCase()
            : column.key === 'scorm_code'
              ? getInternationalizedCode(row).toLowerCase()
            : String(row[column.key] || '').toLowerCase();
        return fieldFilters.some((filterValue) => value.includes(filterValue.toLowerCase()));
      });
    });
  }, [filters, myScormsOnly, rows, scopedResponsibleAgents]);

  const canRenderTable = useMemo(() => filteredRows.length > 0, [filteredRows.length]);

  const filterOptionsByColumn = useMemo(() => {
    return FILTER_SELECT_KEYS.reduce((acc, key) => {
      const uniqueValues = [...new Set(rows.map((row) => String(row[key] || '').trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' })
      );
      acc[key] = uniqueValues;
      return acc;
    }, {});
  }, [rows]);

  const orderedFilterColumns = useMemo(() => {
    const layoutKeys = FILTER_LAYOUT_ROWS.flat();
    const remainingColumns = columns.filter((column) => !layoutKeys.includes(column.key));

    return [
      ...FILTER_LAYOUT_ROWS.map((rowKeys) => rowKeys.map((key) => columns.find((column) => column.key === key)).filter(Boolean)),
      remainingColumns,
    ];
  }, []);

  const availableLanguages = useMemo(() => {
    const discovered = new Set(
      rows
        .map((row) => normalizeLanguage(row.scorm_idioma))
        .filter(Boolean)
    );

    DEFAULT_LANGUAGES.forEach((language) => discovered.add(language));

    return [...discovered].sort((left, right) => {
      const leftIndex = DEFAULT_LANGUAGES.indexOf(left);
      const rightIndex = DEFAULT_LANGUAGES.indexOf(right);

      if (leftIndex !== -1 && rightIndex !== -1) {
        return leftIndex - rightIndex;
      }

      if (leftIndex !== -1) {
        return -1;
      }

      if (rightIndex !== -1) {
        return 1;
      }

      return left.localeCompare(right);
    });
  }, [rows]);

  const translationRows = useMemo(() => {
    const grouped = filteredRows.reduce((acc, row) => {
      const rowCode = String(row.scorm_code || '').trim();
      const groupKey = rowCode || `SIN-CODIGO-${row.id}`;

      if (!acc[groupKey]) {
        acc[groupKey] = {
          groupId: groupKey,
          code: rowCode || 'Sin código',
          nameByLanguage: {},
          rowByLanguage: {},
          languages: new Set(),
          fallbackName: getOfficialName(row),
          representativeRow: row,
        };
      }

      const language = normalizeLanguage(row.scorm_idioma);
      if (language) {
        acc[groupKey].languages.add(language);
        acc[groupKey].nameByLanguage[language] = getOfficialName(row);
        acc[groupKey].rowByLanguage[language] = row;
      }

      return acc;
    }, {});

    return Object.values(grouped)
      .map((group) => ({
        ...group,
        preferredName:
          group.nameByLanguage.ES || group.nameByLanguage.CAT || group.nameByLanguage.PT || group.fallbackName,
        esRow: group.rowByLanguage.ES || null,
        representativeRow: group.representativeRow,
      }))
      .filter((group) => {
        if (translationPreset === 'todos') {
          return true;
        }

        if (translationPreset === 'all') {
          return availableLanguages.every((language) => group.languages.has(language));
        }

        if (translationPreset === 'only_es') {
          return group.languages.size === 1 && group.languages.has('ES');
        }

        if (translationPreset === 'missing_language') {
          return pendingLanguage ? !group.languages.has(pendingLanguage) : true;
        }

        return true;
      })
      .sort((left, right) => left.code.localeCompare(right.code));
  }, [availableLanguages, filteredRows, pendingLanguage, translationPreset]);

  const translatableGroups = useMemo(() => translationRows.filter((group) => group.esRow), [translationRows]);

  const selectedTranslatableGroups = useMemo(
    () => translatableGroups.filter((group) => selectedTranslationGroupIds.includes(group.groupId)),
    [selectedTranslationGroupIds, translatableGroups]
  );

  useEffect(() => {
    const validGroupIds = new Set(translatableGroups.map((group) => group.groupId));

    setSelectedTranslationGroupIds((previous) => previous.filter((groupId) => validGroupIds.has(groupId)));
  }, [translatableGroups]);

  useEffect(() => {
    setTranslationNameDrafts({});
  }, [translationLanguage]);

  const stateGroups = useMemo(() => {
    const groups = filteredRows.reduce((acc, row) => {
      const rowState = getRowState(row);
      if (!acc[rowState]) {
        acc[rowState] = [];
      }
      acc[rowState].push(row);
      return acc;
    }, {});

    const orderedStates = [
      ...STATUS_ORDER,
      ...Object.keys(groups).filter((state) => !STATUS_ORDER.includes(state)).sort((a, b) => a.localeCompare(b)),
    ];

    return orderedStates.map((state) => ({ state, rows: groups[state] || [] }));
  }, [filteredRows]);

  const pendingPublishRows = useMemo(
    () => filteredRows.filter((row) => PUBLISH_PENDING_STATES.includes(getRowState(row))),
    [filteredRows]
  );

  const alertRows = useMemo(() => {
    return filteredRows
      .filter((row) => row.scorms_alerta)
      .sort((left, right) => {
        const leftMs = getDateMsFromCandidates([left.scorms_alerta]);
        const rightMs = getDateMsFromCandidates([right.scorms_alerta]);

        if (leftMs && rightMs && leftMs !== rightMs) {
          return rightMs - leftMs;
        }

        if (leftMs && !rightMs) {
          return -1;
        }

        if (!leftMs && rightMs) {
          return 1;
        }

        return getInternationalizedCode(left).localeCompare(getInternationalizedCode(right));
      });
  }, [filteredRows]);

  const publishUpdatesCount = pendingPublishRows.filter((row) => getRowState(row) === 'Actualizado pendiente de publicar').length;
  const publishPendingCount = pendingPublishRows.filter((row) => getRowState(row) === 'Pendiente de publicar').length;
  const hasItemsPendingPublication = pendingPublishRows.length > 0;

  const publicationRows = useMemo(() => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const rowsForPreset =
      publishPreset === 'nuevos'
        ? pendingPublishRows.filter((row) => getRowState(row) === 'Pendiente de publicar')
        : publishPreset === 'actualizaciones'
          ? pendingPublishRows.filter((row) => getRowState(row) === 'Actualizado pendiente de publicar')
          : publishPreset === 'recientes'
            ? pendingPublishRows.filter((row) => {
                const rowDateMs = getPublicationDateMs(row, latestUpdateByCode);
                return rowDateMs ? rowDateMs >= oneWeekAgo : false;
              })
            : pendingPublishRows;

    return [...rowsForPreset].sort((left, right) => {
      const leftMs = getPublicationDateMs(left, latestUpdateByCode);
      const rightMs = getPublicationDateMs(right, latestUpdateByCode);

      if (leftMs && rightMs && leftMs !== rightMs) {
        return publishDateSortDirection === 'asc' ? leftMs - rightMs : rightMs - leftMs;
      }

      if (leftMs && !rightMs) {
        return -1;
      }

      if (!leftMs && rightMs) {
        return 1;
      }

      return getInternationalizedCode(left).localeCompare(getInternationalizedCode(right));
    });
  }, [latestUpdateByCode, pendingPublishRows, publishDateSortDirection, publishPreset]);

  const relatedCoursesByScormKey = useMemo(() => {
    return coursesRows.reduce((acc, course) => {
      const references = extractScormReferencesFromContenido(course.contenido);

      references.forEach((reference) => {
        const key = `${reference.code}|${reference.language || '*'}`;

        if (!acc[key]) {
          acc[key] = [];
        }

        if (!acc[key].some((item) => item.id === course.id)) {
          acc[key].push(course);
        }
      });

      return acc;
    }, {});
  }, [coursesRows]);

  const getRelatedCoursesForScorm = useCallback(
    (row) => {
      const code = String(row.scorm_code || '').trim().toUpperCase();
      const language = normalizeLanguage(row.scorm_idioma);

      if (!code) {
        return [];
      }

      const exactLanguage = relatedCoursesByScormKey[`${code}|${language}`] || [];
      const genericLanguage = relatedCoursesByScormKey[`${code}|*`] || [];
      const deduped = new Map();

      [...exactLanguage, ...genericLanguage].forEach((course) => {
        deduped.set(course.id, course);
      });

      return Array.from(deduped.values());
    },
    [relatedCoursesByScormKey],
  );

  const getIndividualCourseGroupsForScorm = useCallback(
    (row) => {
      const grouped = getRelatedCoursesForScorm(row).reduce((acc, course) => {
        const identity = getIndividualCourseIdentity(course);

        if (!acc[identity.key]) {
          acc[identity.key] = {
            ...identity,
            rows: [],
          };
        }

        acc[identity.key].rows.push(course);

        return acc;
      }, {});

      return Object.values(grouped).sort((left, right) => left.label.localeCompare(right.label, 'es', { sensitivity: 'base' }));
    },
    [getRelatedCoursesForScorm],
  );

  const getIndividualCourseCountForScorm = useCallback(
    (row) => getIndividualCourseGroupsForScorm(row).length,
    [getIndividualCourseGroupsForScorm],
  );

  const modalIndividualCourseGroups = useMemo(
    () => (coursesModalRow ? getIndividualCourseGroupsForScorm(coursesModalRow) : []),
    [coursesModalRow, getIndividualCourseGroupsForScorm],
  );

  const addFieldFilter = (field) => {
    const nextValue = (filterInputs[field] || '').trim();
    if (!nextValue) {
      return;
    }

    setFilters((previous) => {
      const previousValues = previous[field] || [];
      if (previousValues.some((value) => value.toLowerCase() === nextValue.toLowerCase())) {
        return previous;
      }

      return {
        ...previous,
        [field]: [...previousValues, nextValue],
      };
    });

    setFilterInputs((previous) => ({
      ...previous,
      [field]: '',
    }));
  };

  const removeFieldFilter = (field, valueToRemove) => {
    setFilters((previous) => ({
      ...previous,
      [field]: (previous[field] || []).filter((value) => value !== valueToRemove),
    }));
  };

  const clearFieldFilters = (field) => {
    setFilters((previous) => ({
      ...previous,
      [field]: [],
    }));
  };

  const toggleCellFilter = (field, rawValue) => {
    const nextValue = String(rawValue || '').trim();
    if (!nextValue || nextValue === '-') {
      return;
    }

    setFilters((previous) => {
      const previousValues = previous[field] || [];
      const alreadyExists = previousValues.some((value) => value.toLowerCase() === nextValue.toLowerCase());

      if (alreadyExists) {
        return {
          ...previous,
          [field]: previousValues.filter((value) => value.toLowerCase() !== nextValue.toLowerCase()),
        };
      }

      return {
        ...previous,
        [field]: [...previousValues, nextValue],
      };
    });
  };

  const openDetails = (row) => {
    setActiveRow(row);
    setDetailDraft({ ...row });
    setStatusMessage('');
    setError('');
  };

  const closeDetails = () => {
    setActiveRow(null);
    setDetailDraft(null);
    setHistoryModalOpen(false);
    setHistoryRecords([]);
    setHistoryLoading(false);
  };

  const openHistoryModal = async () => {
    const scormCode = String(detailDraft?.scorm_code || '').trim();

    if (!scormCode) {
      setError('Este SCORM no tiene código y no puede consultar historial de actualizaciones.');
      return;
    }

    setHistoryLoading(true);
    setError('');

    const { data, error: historyError } = await supabase
      .from('scorms_actualizacion')
      .select('*')
      .eq('scorm_codigo', scormCode)
      .order('fecha_modif', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (historyError) {
      setHistoryLoading(false);
      setError(`No se pudo cargar el historial de actualizaciones: ${historyError.message}`);
      return;
    }

    setHistoryRecords(data || []);
    setHistoryLoading(false);
    setHistoryModalOpen(true);
  };

  const openUpdateModal = (rowsToUpdate) => {
    const normalizedRows = Array.isArray(rowsToUpdate) ? rowsToUpdate : [rowsToUpdate];
    const validRows = normalizedRows.filter(Boolean);

    if (validRows.length === 0) {
      return;
    }

    setError('');
    setStatusMessage('');
    setUpdateTargetRows(validRows);
    setUpdateTargetRow(validRows[0]);
    setUpdateForm({
      cambio_tipo: '',
      fecha_modif: new Date().toISOString().slice(0, 10),
      cambio_user: '',
      cambio_notas: '',
    });
  };

  const closeUpdateModal = () => {
    if (updateSubmitting) {
      return;
    }

    setUpdateTargetRow(null);
    setUpdateTargetRows([]);
  };

  const openCreateModal = () => {
    setError('');
    setStatusMessage('');
    setCreateDraft({
      scorm_idioma: 'ES',
      scorm_code: getNextAvailableScormCode(rows),
      scorm_name: '',
      scorm_responsable: '',
      scorm_tipo: '',
      scorm_categoria: '',
      scorm_subcategoria: '',
      scorm_url: '',
      scorm_estado: 'En proceso',
      scorm_etiquetas: '',
    });
  };

  const closeCreateModal = () => {
    if (createSubmitting) {
      return;
    }

    setCreateDraft(null);
  };

  const toggleTranslationGroupSelection = (groupId) => {
    setSelectedTranslationGroupIds((previous) =>
      previous.includes(groupId) ? previous.filter((id) => id !== groupId) : [...previous, groupId]
    );
  };

  const toggleSelectAllTranslatableGroups = () => {
    const visibleIds = translatableGroups.map((group) => group.groupId);
    const areAllSelected = visibleIds.length > 0 && visibleIds.every((groupId) => selectedTranslationGroupIds.includes(groupId));

    if (areAllSelected) {
      setSelectedTranslationGroupIds((previous) => previous.filter((groupId) => !visibleIds.includes(groupId)));
      return;
    }

    setSelectedTranslationGroupIds((previous) => [...new Set([...previous, ...visibleIds])]);
  };

  const openTranslationModal = () => {
    if (selectedTranslatableGroups.length === 0) {
      setError('Selecciona uno o varios SCORMs en ES para añadir su traducción.');
      return;
    }

    setError('');
    setStatusMessage('');
    setTranslationNameDrafts(() =>
      selectedTranslatableGroups.reduce((acc, group) => {
        acc[group.groupId] = group.nameByLanguage[translationLanguage] || group.nameByLanguage.ES || group.preferredName;
        return acc;
      }, {})
    );
    setTranslationModalOpen(true);
  };

  const closeTranslationModal = () => {
    if (translationSubmitting) {
      return;
    }

    setTranslationModalOpen(false);
    setTranslationNameDrafts({});
  };

  const updateTranslationNameDraft = (groupId, value) => {
    setTranslationNameDrafts((previous) => ({
      ...previous,
      [groupId]: value,
    }));
  };

  const updateCreateDraft = (field, value) => {
    setCreateDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateUpdateFormField = (field, value) => {
    setUpdateForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateDetailDraft = (field, value) => {
    setDetailDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveDetails = async () => {
    if (!detailDraft?.id) {
      return;
    }

    const payload = editableColumns.reduce((acc, key) => {
      acc[key] = detailDraft[key] || null;
      return acc;
    }, {});

    if (payload.scorm_estado === 'Publicado' && !canPublishAsAdmin) {
      setStatusMessage('');
      setError('Solo los usuarios ADMIN pueden poner un SCORM en estado "Publicado".');
      return;
    }

    const { error: updateError } = await supabase
      .from('scorms_master')
      .update(payload)
      .eq('id', detailDraft.id);

    if (updateError) {
      setStatusMessage('');
      setError(`No se pudo guardar la fila ${detailDraft.id}: ${updateError.message}`);
      return;
    }

    setRows((previousRows) =>
      previousRows.map((row) => (row.id === detailDraft.id ? { ...row, ...detailDraft } : row))
    );
    setActiveRow((previous) => (previous ? { ...previous, ...detailDraft } : previous));
    setStatusMessage(`Fila ${detailDraft.id} actualizada correctamente.`);
    setError('');
    closeDetails();
  };

  const toggleCardExpansion = (rowId) => {
    setExpandedCardIds((previous) =>
      previous.includes(rowId) ? previous.filter((id) => id !== rowId) : [...previous, rowId]
    );
  };

  const toggleSelection = (rowId) => {
    setSelectedIds((previous) =>
      previous.includes(rowId) ? previous.filter((id) => id !== rowId) : [...previous, rowId]
    );
  };

  const toggleAllFilteredRows = () => {
    const visibleIds = filteredRows.map((row) => row.id);
    const areAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    if (areAllSelected) {
      setSelectedIds((previous) => previous.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((previous) => [...new Set([...previous, ...visibleIds])]);
  };

  const persistStatusUpdates = async (statusByRowId) => {
    const entries = Object.entries(statusByRowId);
    if (entries.length === 0) {
      return { ok: true };
    }

    const updates = entries.map(([rowId, state]) =>
      supabase.from('scorms_master').update({ scorm_estado: state }).eq('id', Number(rowId))
    );
    const results = await Promise.all(updates);
    const failedUpdate = results.find((result) => result.error);

    if (failedUpdate?.error) {
      return { ok: false, message: failedUpdate.error.message };
    }

    return { ok: true };
  };

  const updateRowsStatus = async (rowIds, nextState, options = { recordHistory: true }) => {
    if (rowIds.length === 0 || !nextState) {
      return;
    }

    if (nextState === 'Publicado' && !canPublishAsAdmin) {
      setStatusMessage('');
      setError('Solo los usuarios ADMIN pueden poner un SCORM en estado "Publicado".');
      return;
    }

    setError('');
    setStatusMessage('');

    const fromStates = {};
    const statusByRowId = {};

    rowIds.forEach((rowId) => {
      const row = rows.find((item) => item.id === rowId);
      if (row) {
        fromStates[rowId] = getRowState(row);
        statusByRowId[rowId] = nextState;
      }
    });

    const persistResult = await persistStatusUpdates(statusByRowId);
    if (!persistResult.ok) {
      setError(`No se pudieron mover los SCORM seleccionados: ${persistResult.message}`);
      return;
    }

    setRows((previousRows) =>
      previousRows.map((row) =>
        rowIds.includes(row.id)
          ? {
              ...row,
              scorm_estado: nextState,
            }
          : row
      )
    );

    setSelectedIds([]);
    setDraggedRowIds([]);

    if (options.recordHistory) {
      setMoveHistory((previous) => [...previous, { rowIds, fromStates, toState: nextState }]);
      setRedoHistory([]);
    }

    setStatusMessage(
      rowIds.length === 1
        ? 'SCORM movido correctamente al nuevo estado.'
        : `${rowIds.length} SCORMs movidos correctamente al nuevo estado.`
    );
  };

  const handleUndo = async () => {
    const lastMove = moveHistory[moveHistory.length - 1];
    if (!lastMove) {
      return;
    }

    const restoreStates = lastMove.rowIds.reduce((acc, rowId) => {
      if (lastMove.fromStates[rowId]) {
        acc[rowId] = lastMove.fromStates[rowId];
      }
      return acc;
    }, {});

    setError('');
    setStatusMessage('');

    const persistResult = await persistStatusUpdates(restoreStates);
    if (!persistResult.ok) {
      setError(`No se pudo deshacer el movimiento: ${persistResult.message}`);
      return;
    }

    setRows((previousRows) =>
      previousRows.map((row) =>
        restoreStates[row.id]
          ? {
              ...row,
              scorm_estado: restoreStates[row.id],
            }
          : row
      )
    );

    setMoveHistory((previous) => previous.slice(0, -1));
    setRedoHistory((previous) => [...previous, lastMove]);
    setStatusMessage('Último movimiento deshecho correctamente.');
  };

  const handleRedo = async () => {
    const moveToRestore = redoHistory[redoHistory.length - 1];
    if (!moveToRestore) {
      return;
    }

    await updateRowsStatus(moveToRestore.rowIds, moveToRestore.toState, { recordHistory: false });
    setRedoHistory((previous) => previous.slice(0, -1));
    setMoveHistory((previous) => [...previous, moveToRestore]);
    setStatusMessage('Movimiento rehecho correctamente.');
  };

  const handleCardClick = (event, rowId) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      toggleSelection(rowId);
      return;
    }

    toggleCardExpansion(rowId);
  };

  const handleDragStart = (event, rowId) => {
    const rowIdsToMove = selectedIds.includes(rowId) ? selectedIds : [rowId];
    event.dataTransfer.setData('text/plain', JSON.stringify(rowIdsToMove));
    event.dataTransfer.effectAllowed = 'move';
    setDraggedRowIds(rowIdsToMove);
  };

  const handleDragEnd = () => {
    setDragOverState('');
    setDraggedRowIds([]);
  };

  const handleDropInState = async (event, targetState) => {
    event.preventDefault();
    setDragOverState('');

    let draggedIds = [];
    try {
      draggedIds = JSON.parse(event.dataTransfer.getData('text/plain') || '[]');
    } catch {
      draggedIds = [];
    }

    const uniqueIds = [...new Set(draggedIds)].filter(Boolean);
    if (uniqueIds.length === 0) {
      return;
    }

    const idsToMove = uniqueIds.filter((rowId) => {
      const row = rows.find((item) => item.id === rowId);
      return row && getRowState(row) !== targetState;
    });

    await updateRowsStatus(idsToMove, targetState);
  };

  const submitScormUpdate = async () => {
    if (updateTargetRows.length === 0) {
      return;
    }

    if (!updateForm.cambio_tipo) {
      setError('Debes seleccionar un tipo de cambio para registrar la actualización.');
      return;
    }

    const rowsWithoutCode = updateTargetRows.filter((row) => !String(row.scorm_code || '').trim());
    if (rowsWithoutCode.length > 0) {
      setError('No se pueden actualizar algunos SCORM porque no tienen scorm_code informado.');
      return;
    }

    setUpdateSubmitting(true);
    setError('');
    setStatusMessage('');

    const payload = updateTargetRows.map((row) => ({
      scorm_codigo: String(row.scorm_code || '').trim(),
      cambio_tipo: updateForm.cambio_tipo,
      fecha_modif: updateForm.fecha_modif || null,
      cambio_user: updateForm.cambio_user || null,
      cambio_notas: updateForm.cambio_notas || null,
    }));

    const { error: insertError } = await supabase.from('scorms_actualizacion').insert(payload);

    if (insertError) {
      setUpdateSubmitting(false);
      setError(`No se pudo registrar la actualización del SCORM: ${insertError.message}`);
      return;
    }

    const { error: stateError } = await supabase
      .from('scorms_master')
      .update({ scorm_estado: 'Actualizado pendiente de publicar' })
      .in(
        'id',
        updateTargetRows.map((row) => row.id)
      );

    if (stateError) {
      setUpdateSubmitting(false);
      setError(`Se registró el cambio, pero no se pudo actualizar el estado: ${stateError.message}`);
      return;
    }

    setRows((previousRows) =>
      previousRows.map((row) =>
        updateTargetRows.some((targetRow) => targetRow.id === row.id)
          ? { ...row, scorm_estado: 'Actualizado pendiente de publicar' }
          : row
      )
    );
    setDetailDraft((previous) =>
      previous && updateTargetRows.some((targetRow) => targetRow.id === previous.id)
        ? { ...previous, scorm_estado: 'Actualizado pendiente de publicar' }
        : previous
    );
    setActiveRow((previous) =>
      previous && updateTargetRows.some((targetRow) => targetRow.id === previous.id)
        ? { ...previous, scorm_estado: 'Actualizado pendiente de publicar' }
        : previous
    );
    setUpdateTargetRow(null);
    setUpdateTargetRows([]);
    setSelectedIds([]);
    setUpdateSubmitting(false);
    setStatusMessage(
      updateTargetRows.length === 1
        ? 'Actualización SCORM registrada y estado cambiado a "Actualizado pendiente de publicar".'
        : `${updateTargetRows.length} SCORMs actualizados y marcados como "Actualizado pendiente de publicar".`
    );
  };

  const submitCreateTranslations = async () => {
    if (selectedTranslatableGroups.length === 0) {
      setError('Selecciona uno o varios SCORMs en ES para añadir su traducción.');
      return;
    }

    const targetLanguage = normalizeLanguage(translationLanguage);

    if (!targetLanguage || targetLanguage === 'ES') {
      setError('Debes elegir un idioma de traducción distinto de ES.');
      return;
    }

    const groupsMissingName = selectedTranslatableGroups.filter(
      (group) => !String(translationNameDrafts[group.groupId] || '').trim()
    );

    if (groupsMissingName.length > 0) {
      setError('Debes informar el nombre traducido de todos los SCORMs seleccionados.');
      return;
    }

    const existingByCodeAndLanguage = new Set(
      rows
        .map((row) => `${normalizeLanguage(row.scorm_idioma)}|${String(row.scorm_code || '').trim().toUpperCase()}`)
        .filter((value) => !value.endsWith('|'))
    );

    const duplicates = selectedTranslatableGroups.filter((group) =>
      existingByCodeAndLanguage.has(`${targetLanguage}|${String(group.code || '').trim().toUpperCase()}`)
    );

    if (duplicates.length > 0) {
      setError(
        `Ya existen traducciones en ${targetLanguage} para: ${duplicates.map((group) => group.code).join(', ')}.`
      );
      return;
    }

    setTranslationSubmitting(true);
    setError('');
    setStatusMessage('');

    const payload = selectedTranslatableGroups.map((group) => {
      const esRow = group.esRow;
      const translatedName = String(translationNameDrafts[group.groupId] || '').trim();

      return {
        scorm_idioma: targetLanguage,
        scorm_code: String(esRow.scorm_code || '').trim().toUpperCase(),
        scorm_name: translatedName,
        scorm_responsable: esRow.scorm_responsable || null,
        scorm_tipo: esRow.scorm_tipo || null,
        scorm_categoria: esRow.scorm_categoria || null,
        scorm_subcategoria: esRow.scorm_subcategoria || null,
        scorm_url: esRow.scorm_url || null,
        scorm_estado: esRow.scorm_estado || 'En proceso',
        scorm_etiquetas: esRow.scorm_etiquetas || null,
      };
    });

    const { data, error: insertError } = await supabase.from('scorms_master').insert(payload).select('*');

    if (insertError) {
      setTranslationSubmitting(false);
      setError(`No se pudieron crear las traducciones: ${insertError.message}`);
      return;
    }

    if (data?.length > 0) {
      setRows((previous) => [...previous, ...data]);
    }

    setTranslationSubmitting(false);
    setTranslationModalOpen(false);
    setTranslationNameDrafts({});
    setSelectedTranslationGroupIds([]);
    setStatusMessage(
      payload.length === 1
        ? `Traducción ${targetLanguage}-${payload[0].scorm_code} creada correctamente.`
        : `${payload.length} traducciones creadas correctamente en ${targetLanguage}.`
    );
  };

  const submitCreateScorm = async () => {
    if (!createDraft) {
      return;
    }

    const code = String(createDraft.scorm_code || '').trim().toUpperCase();
    const name = String(createDraft.scorm_name || '').trim();

    if (!code || !name) {
      setError('Para crear el SCORM debes informar, como mínimo, Código y Nombre.');
      return;
    }

    const alreadyExists = rows.some((row) => String(row.scorm_code || '').trim().toUpperCase() === code);
    if (alreadyExists) {
      setError(`El código ${code} ya existe. Usa otro código libre.`);
      return;
    }

    setCreateSubmitting(true);
    setError('');
    setStatusMessage('');

    const payload = editableColumns.reduce((acc, key) => {
      const value = createDraft[key];
      acc[key] = typeof value === 'string' ? value.trim() || null : value || null;
      return acc;
    }, {});

    payload.scorm_code = code;

    if (payload.scorm_estado === 'Publicado' && !canPublishAsAdmin) {
      setCreateSubmitting(false);
      setError('Solo los usuarios ADMIN pueden poner un SCORM en estado "Publicado".');
      return;
    }

    const { data, error: insertError } = await supabase.from('scorms_master').insert(payload).select('*').single();

    if (insertError) {
      setCreateSubmitting(false);
      setError(`No se pudo crear el SCORM: ${insertError.message}`);
      return;
    }

    if (data) {
      setRows((previous) => [...previous, data]);
    }

    setCreateSubmitting(false);
    setCreateDraft(null);
    setStatusMessage(`SCORM ${code} creado correctamente.`);
  };

  const publishScorm = async (row) => {
    if (!row?.id) {
      return;
    }

    if (!canPublishAsAdmin) {
      setError('Solo los usuarios ADMIN pueden poner un SCORM en estado "Publicado".');
      setStatusMessage('');
      return;
    }

    const previousState = getRowState(row);
    if (previousState === 'Publicado') {
      setStatusMessage(`SCORM ${getInternationalizedCode(row)} ya está publicado.`);
      return;
    }

    setError('');
    setStatusMessage('');

    const { error: publishError } = await supabase
      .from('scorms_master')
      .update({ scorm_estado: 'Publicado' })
      .eq('id', row.id);

    if (publishError) {
      setError(`No se pudo publicar el SCORM: ${publishError.message}`);
      return;
    }

    setRows((previousRows) =>
      previousRows.map((currentRow) =>
        currentRow.id === row.id
          ? {
              ...currentRow,
              scorm_estado: 'Publicado',
            }
          : currentRow
      )
    );

    setDetailDraft((previous) =>
      previous?.id === row.id
        ? {
            ...previous,
            scorm_estado: 'Publicado',
          }
        : previous
    );
    setActiveRow((previous) =>
      previous?.id === row.id
        ? {
            ...previous,
            scorm_estado: 'Publicado',
          }
        : previous
    );

    setMoveHistory((previous) => [
      ...previous,
      {
        rowIds: [row.id],
        fromStates: { [row.id]: previousState },
        toState: 'Publicado',
      },
    ]);
    setRedoHistory([]);

    setStatusMessage(`SCORM ${getInternationalizedCode(row)} publicado correctamente.`);
  };

  const togglePublishDateSort = () => {
    setPublishDateSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <section className="card card-wide">
      <header className="card-header">
        <h2>GScormer · v{APP_VERSION}</h2>
        <div className="header-actions">
          <button type="button" className="secondary" onClick={() => setViewMode('table')} disabled={viewMode === 'table'}>
            Tabla
          </button>
          <button type="button" className="secondary" onClick={() => setViewMode('status')} disabled={viewMode === 'status'}>
            Vista por estado
          </button>
          {canPublishAsAdmin && (
            <button
              type="button"
              className={`secondary ${hasItemsPendingPublication ? 'pending-highlight' : ''}`}
              onClick={() => setViewMode('publish')}
              disabled={viewMode === 'publish'}
            >
              Publicación pendiente
              <span className="kpi-badge">{pendingPublishRows.length}</span>
            </button>
          )}
          <button
            type="button"
            className="secondary"
            onClick={() => setViewMode('translations')}
            disabled={viewMode === 'translations'}
          >
            Traducciones
          </button>
          <button
            type="button"
            className={`secondary ${alertRows.length > 0 ? 'pending-highlight' : ''}`}
            onClick={() => setViewMode('alerts')}
            disabled={viewMode === 'alerts'}
          >
            Alertas actualizaciones
            <span className="kpi-badge">{alertRows.length}</span>
          </button>
          <button type="button" className="secondary" onClick={fetchData}>
            Recargar
          </button>
          <button
            type="button"
            className={`secondary ${myScormsOnly ? 'active-preset' : ''}`}
            onClick={() => setMyScormsOnly((previous) => !previous)}
            disabled={scopedResponsibleAgents.length === 0}
            title={
              scopedResponsibleAgents.length > 0
                ? `Filtrar por responsables asociados (${scopedResponsibleAgents.length})`
                : 'Tu usuario no tiene responsables asociados'
            }
          >
            Mis scorms
          </button>
        </div>
      </header>

      {myScormsOnly && scopedResponsibleAgents.length > 0 && (
        <p className="status">Filtro activo por responsables: {scopedResponsibleAgents.join(', ')}</p>
      )}

      {statusMessage && <p className="status ok">{statusMessage}</p>}
      {error && <p className="status error">{error}</p>}

      {loading && <p className="status">Cargando datos...</p>}

      {!loading && !canRenderTable && !error && (
        <p className="status">No hay registros que coincidan con los filtros actuales.</p>
      )}

      {!loading && canRenderTable && (
        <section className="table-filters-toggle global-filters-toggle">
          <div
            className="filter-panel-title filter-panel-title-interactive"
            role="button"
            tabIndex={0}
            onClick={() => setFiltersCollapsed((previous) => !previous)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setFiltersCollapsed((previous) => !previous);
              }
            }}
            aria-expanded={!filtersCollapsed}
          >
            <div className="filter-panel-title-main">
              <strong>Filtros</strong>
              {Object.values(filters).flat().length > 0 && <span className="filter-counter">{Object.values(filters).flat().length}</span>}
            </div>
            <span className="filter-collapse-label">{filtersCollapsed ? 'Expandir' : 'Colapsar'}</span>
          </div>

          <div className={`filters-panel-body ${filtersCollapsed ? 'filters-panel-body-collapsed' : ''}`}>
            {orderedFilterColumns.map((filterRow, rowIndex) => (
              <div key={`filter-row-${rowIndex}`} className="filters-grid compact filters-grid-row">
                {filterRow.map((column) => {
                  const label = FILTER_LABELS[column.key] || column.label;
                  const usesSelect = FILTER_SELECT_KEYS.includes(column.key);

                  return (
                    <div key={column.key} className="filter-dropdown filter-card">
                      <div className="filter-card-header">
                        <span>{label}</span>
                        {(filters[column.key] || []).length > 0 && (
                          <span className="filter-counter">{(filters[column.key] || []).length}</span>
                        )}
                      </div>

                      <div className="filter-dropdown-content">
                        <div className="filter-controls">
                          {usesSelect ? (
                            <select
                              value={filterInputs[column.key] || ''}
                              onChange={(event) =>
                                setFilterInputs((previous) => ({
                                  ...previous,
                                  [column.key]: event.target.value,
                                }))
                              }
                            >
                              <option value="">Selecciona un valor</option>
                              {(filterOptionsByColumn[column.key] || []).map((option) => (
                                <option key={`${column.key}-${option}`} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder={`Añadir filtro en ${label}`}
                              value={filterInputs[column.key] || ''}
                              onChange={(event) =>
                                setFilterInputs((previous) => ({
                                  ...previous,
                                  [column.key]: event.target.value,
                                }))
                              }
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  addFieldFilter(column.key);
                                }
                              }}
                            />
                          )}

                          <button type="button" className="secondary" onClick={() => addFieldFilter(column.key)}>
                            Añadir
                          </button>
                        </div>

                        <div className="filter-tags">
                          {(filters[column.key] || []).map((value) => (
                            <button
                              key={`${column.key}-${value}`}
                              type="button"
                              className="filter-tag"
                              onClick={() => removeFieldFilter(column.key, value)}
                            >
                              {value} ✕
                            </button>
                          ))}
                          {(filters[column.key] || []).length > 0 && (
                            <button type="button" className="clear-filters" onClick={() => clearFieldFilters(column.key)}>
                              Quitar filtros
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && canRenderTable && viewMode === 'table' && (
        <div className="table-wrapper">
          <div className="table-top-controls">
            <div className="header-actions table-actions">
              <button type="button" onClick={openCreateModal}>
                Crear SCORM
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => openUpdateModal(rows.filter((row) => selectedIds.includes(row.id)))}
                disabled={selectedIds.length === 0}
              >
                Actualizar selección ({selectedIds.length})
              </button>
              <button type="button" className="secondary" disabled={moveHistory.length === 0} onClick={handleUndo}>
                ← DESHACER
              </button>
              <button type="button" className="secondary" disabled={redoHistory.length === 0} onClick={handleRedo}>
                REHACER →
              </button>
            </div>

          </div>

          <table>
            <thead>
              <tr>
                <th className="col-selector">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todos los SCORM visibles"
                    checked={
                      filteredRows.length > 0 && filteredRows.every((row) => selectedIds.includes(row.id))
                    }
                    onChange={toggleAllFilteredRows}
                  />
                </th>
                {columns.map((column) => (
                  <th key={column.key} className={`col-${column.key}`}>
                    {column.label}
                  </th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td className="col-selector">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar SCORM ${getOfficialName(row)}`}
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleSelection(row.id)}
                    />
                  </td>
                  {columns.map((column) => {
                    const scormTestDisplay = column.key === 'scorm_test' ? getScormTestDisplay(row[column.key]) : null;
                    const displayValue =
                      column.key === 'scorm_name'
                        ? getOfficialName(row)
                        : column.key === 'scorm_code'
                          ? getInternationalizedCode(row)
                          : column.key === 'scorm_test'
                            ? scormTestDisplay.value
                          : row[column.key] || '-';
                    const hasActiveValueFilter = (filters[column.key] || []).some(
                      (filterValue) => filterValue.toLowerCase() === String(displayValue || '').trim().toLowerCase()
                    );

                    return (
                      <td
                        key={`${row.id}-${column.key}`}
                        className={`col-${column.key} cell-selectable ${hasActiveValueFilter ? 'cell-selected' : ''}`}
                        onClick={() => {
                          if (column.key !== 'scorm_etiquetas') {
                            toggleCellFilter(column.key, displayValue);
                          }
                        }}
                        title={column.key === 'scorm_etiquetas' ? 'Abrir cursos relacionados' : 'Click para filtrar por este valor'}
                      >
                        {column.key === 'scorm_url' ? (
                          row[column.key] ? (
                            <a
                              href={row[column.key]}
                              target="_blank"
                              rel="noreferrer"
                              className="table-link"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Abrir enlace
                            </a>
                          ) : (
                            <span className="muted">Sin URL</span>
                          )
                        ) : column.key === 'scorm_categoria' ? (
                          <span className="category-chip" style={getCategoryColor(row[column.key])}>
                            {row[column.key] || 'Sin categoría'}
                          </span>
                        ) : column.key === 'scorm_name' ? (
                          <span>{getOfficialName(row)}</span>
                        ) : column.key === 'scorm_code' ? (
                          <span>{getInternationalizedCode(row)}</span>
                        ) : column.key === 'scorm_etiquetas' ? (
                          <button
                            type="button"
                            className="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              setCoursesModalRow(row);
                            }}
                          >
                            Cursos individuales ({getIndividualCourseCountForScorm(row)})
                          </button>
                        ) : column.key === 'scorm_test' ? (
                          <span className={`test-indicator ${scormTestDisplay.isPositive ? 'ok' : 'error'}`}>
                            {scormTestDisplay.value} {scormTestDisplay.isPositive ? '✅' : '❌'}
                          </span>
                        ) : (
                          <span>{row[column.key] || '-'}</span>
                        )}
                      </td>
                    );
                  })}
                  <td>
                    <div className="row-actions">
                      <button type="button" className="secondary action-button" onClick={() => openDetails(row)}>
                        Detalles
                      </button>
                      <button
                        type="button"
                        className="secondary action-button"
                        onClick={() => openUpdateModal(row)}
                      >
                        Actualizar SCORM
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && canRenderTable && viewMode === 'status' && (
        <>
          <div className="status-board-actions">
            <button type="button" className="secondary" disabled={moveHistory.length === 0} onClick={handleUndo}>
              ← DESHACER
            </button>
            <button type="button" className="secondary" disabled={redoHistory.length === 0} onClick={handleRedo}>
              REHACER →
            </button>
          </div>

          <section className="status-board">
            {stateGroups.map((group) => (
              <article
                key={group.state}
                className={`status-lane ${dragOverState === group.state ? 'drag-over' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (dragOverState !== group.state) {
                    setDragOverState(group.state);
                  }
                }}
                onDragEnter={() => setDragOverState(group.state)}
                onDragLeave={() => {
                  if (dragOverState === group.state) {
                    setDragOverState('');
                  }
                }}
                onDrop={(event) => handleDropInState(event, group.state)}
              >
                <header>
                  <h4>
                    {group.state}
                    <span className="status-kpi-circle" aria-label={`${group.rows.length} SCORMs en ${group.state}`}>
                      {group.rows.length}
                    </span>
                  </h4>
                </header>

                <div className="status-lane-cards">
                  {group.rows.map((row) => {
                    const isSelected = selectedIds.includes(row.id);
                    const isExpanded = expandedCardIds.includes(row.id);

                    return (
                      <div
                        key={row.id}
                        className={`status-card ${isSelected ? 'selected' : ''}`}
                        draggable
                        onDragStart={(event) => handleDragStart(event, row.id)}
                        onDragEnd={handleDragEnd}
                        onClick={(event) => handleCardClick(event, row.id)}
                      >
                        <div className="status-card-main">
                          <strong>{getOfficialName(row)}</strong>
                          <span>{getInternationalizedCode(row)}</span>
                        </div>
                        <span className="category-chip" style={getCategoryColor(row.scorm_categoria)}>
                          {row.scorm_categoria || 'Sin categoría'}
                        </span>

                        {isExpanded && (
                          <div className="status-card-details">
                            <p>
                              <strong>Responsable:</strong> {row.scorm_responsable || '-'}
                            </p>
                            <p>
                              <strong>Tipo:</strong> {row.scorm_tipo || '-'}
                            </p>
                            <p>
                              <strong>Subcategoría:</strong> {row.scorm_subcategoria || '-'}
                            </p>
                            <p>
                              <strong>Cursos relacionados:</strong> {getRelatedCoursesForScorm(row).length}
                            </p>
                            <div className="card-actions">
                              <button type="button" className="secondary action-button" onClick={() => openDetails(row)}>
                                Detalles
                              </button>
                              <button
                                type="button"
                                className="secondary action-button"
                                onClick={() => openUpdateModal(row)}
                              >
                                Actualizar SCORM
                              </button>
                            </div>
                            {row.scorm_url ? (
                              <a href={row.scorm_url} target="_blank" rel="noreferrer" className="table-link">
                                Abrir enlace
                              </a>
                            ) : (
                              <span className="muted">Sin URL</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {!loading && canRenderTable && viewMode === 'translations' && (
        <section className="translations-view">
          <div className="translation-presets">
            <button
              type="button"
              className={`secondary ${translationPreset === 'todos' ? 'active-preset' : ''}`}
              onClick={() => setTranslationPreset('todos')}
            >
              TODOS
            </button>
            <button
              type="button"
              className={`secondary ${translationPreset === 'all' ? 'active-preset' : ''}`}
              onClick={() => setTranslationPreset('all')}
            >
              Traducidos a todos los idiomas
            </button>
            <button
              type="button"
              className={`secondary ${translationPreset === 'only_es' ? 'active-preset' : ''}`}
              onClick={() => setTranslationPreset('only_es')}
            >
              Solo en Español
            </button>
            <div className="missing-language-filter">
              <button
                type="button"
                className={`secondary ${translationPreset === 'missing_language' ? 'active-preset' : ''}`}
                onClick={() => setTranslationPreset('missing_language')}
              >
                Pendiente de idioma
              </button>
              <select
                value={pendingLanguage}
                onChange={(event) => {
                  setPendingLanguage(event.target.value);
                  setTranslationPreset('missing_language');
                }}
                aria-label="Seleccionar idioma pendiente"
              >
                {availableLanguages.map((language) => (
                  <option key={`pending-${language}`} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
            <div className="translation-actions">
              <select
                value={translationLanguage}
                onChange={(event) => setTranslationLanguage(event.target.value)}
                aria-label="Seleccionar idioma para nueva traducción"
              >
                {availableLanguages
                  .filter((language) => language !== 'ES')
                  .map((language) => (
                    <option key={`target-language-${language}`} value={language}>
                      {language} · {LANGUAGE_LABELS[language] || language}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={openTranslationModal}
                disabled={selectedTranslatableGroups.length === 0}
                title="Selecciona uno o varios SCORMs en ES"
              >
                Añadir traducción ({selectedTranslatableGroups.length})
              </button>
            </div>
          </div>

          {translationRows.length === 0 ? (
            <p className="status">No hay SCORMs que coincidan con el filtro de traducciones seleccionado.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          translatableGroups.length > 0 &&
                          translatableGroups.every((group) => selectedTranslationGroupIds.includes(group.groupId))
                        }
                        onChange={toggleSelectAllTranslatableGroups}
                        aria-label="Seleccionar todos los SCORMs en ES visibles"
                      />
                    </th>
                    <th>Código</th>
                    <th>Nombre</th>
                    {availableLanguages.map((language) => (
                      <th key={`translation-head-${language}`}>{language}</th>
                    ))}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {translationRows.map((group) => (
                    <tr key={`translation-${group.groupId}`}>
                      <td>
                        {group.esRow ? (
                          <input
                            type="checkbox"
                            checked={selectedTranslationGroupIds.includes(group.groupId)}
                            onChange={() => toggleTranslationGroupSelection(group.groupId)}
                            aria-label={`Seleccionar ${group.code} en ES`}
                          />
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td>{group.code}</td>
                      <td className="col-scorm_name">{group.preferredName}</td>
                      {availableLanguages.map((language) => (
                        <td key={`translation-${group.groupId}-${language}`}>
                          {group.languages.has(language) ? (
                            <span className="lang-ok">Disponible</span>
                          ) : (
                            <span className="muted">Pendiente</span>
                          )}
                        </td>
                      ))}
                      <td>
                        {group.representativeRow ? (
                          <div className="row-actions">
                            <button type="button" onClick={() => openDetails(group.representativeRow)}>
                              Detalles
                            </button>
                            <button type="button" className="secondary action-button" onClick={() => openUpdateModal(group.representativeRow)}>
                              Actualizar SCORM
                            </button>
                          </div>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {!loading && canPublishAsAdmin && viewMode === 'publish' && (
        <section className="publish-view">
          <div className="translation-presets">
            <button
              type="button"
              className={`secondary ${publishPreset === 'todos' ? 'active-preset' : ''}`}
              onClick={() => setPublishPreset('todos')}
            >
              TODOS
            </button>
            <button
              type="button"
              className={`secondary ${publishPreset === 'recientes' ? 'active-preset' : ''}`}
              onClick={() => setPublishPreset('recientes')}
            >
              Recientes
            </button>
            <button
              type="button"
              className={`secondary ${publishPreset === 'nuevos' ? 'active-preset' : ''}`}
              onClick={() => setPublishPreset('nuevos')}
            >
              Pendientes de publicar
              <span className="preset-kpi-badge" title="SCORMs nuevos pendientes de publicar">
                {publishPendingCount}
              </span>
            </button>
            <button
              type="button"
              className={`secondary ${publishPreset === 'actualizaciones' ? 'active-preset' : ''} ${
                hasItemsPendingPublication ? 'pending-highlight' : ''
              }`}
              onClick={() => setPublishPreset('actualizaciones')}
            >
              Actualizaciones
              <span className="preset-kpi-badge" title="SCORMs actualizados pendientes de publicar">
                {publishUpdatesCount}
              </span>
            </button>
          </div>

          <div className="status-board-actions">
            <button type="button" className="secondary" disabled={moveHistory.length === 0} onClick={handleUndo}>
              ← DESHACER
            </button>
            <button type="button" className="secondary" disabled={redoHistory.length === 0} onClick={handleRedo}>
              REHACER →
            </button>
          </div>

          {publicationRows.length === 0 ? (
            <p className="status">No hay SCORMs para publicar con el filtro seleccionado.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {publishColumns.map((column) => (
                      <th key={`publish-head-${column.key}`} className={`col-${column.key}`}>
                        {column.key === 'publication_date' ? (
                          <button type="button" className="table-sort-button" onClick={togglePublishDateSort}>
                            {column.label} {publishDateSortDirection === 'asc' ? '↑' : '↓'}
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    ))}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {publicationRows.map((row) => (
                    <tr key={`publish-row-${row.id}`}>
                      {publishColumns.map((column) => (
                        <td key={`publish-${row.id}-${column.key}`} className={`col-${column.key}`}>
                          {column.key === 'publication_date' ? (
                            <span>{formatDateDDMMYYYY(getPublicationDateMs(row, latestUpdateByCode))}</span>
                          ) : column.key === 'publication_update_type' ? (
                            <span>{getPublicationUpdateType(row, latestUpdateByCode)}</span>
                          ) : column.key === 'scorm_url' ? (
                            row[column.key] ? (
                              <a href={row[column.key]} target="_blank" rel="noreferrer" className="table-link">
                                Abrir enlace
                              </a>
                            ) : (
                              <span className="muted">Sin URL</span>
                            )
                          ) : column.key === 'scorm_categoria' ? (
                            <span className="category-chip" style={getCategoryColor(row[column.key])}>
                              {row[column.key] || 'Sin categoría'}
                            </span>
                          ) : column.key === 'scorm_name' ? (
                            <span>{getOfficialName(row)}</span>
                          ) : column.key === 'scorm_code' ? (
                            <span>{getInternationalizedCode(row)}</span>
                          ) : (
                            <span>{row[column.key] || '-'}</span>
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="row-actions">
                          <button type="button" className="secondary action-button" onClick={() => openDetails(row)}>
                            Detalles
                          </button>
                          <button type="button" className="publish-button action-button" onClick={() => publishScorm(row)}>
                            PUBLICAR SCORM
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {!loading && canRenderTable && viewMode === 'alerts' && (
        <section className="publish-view">
          {alertRows.length === 0 ? (
            <p className="status">No hay SCORMs con alerta de actualización.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {alertColumns.map((column) => (
                      <th key={`alert-head-${column.key}`} className={`col-${column.key}`}>
                        {column.label}
                      </th>
                    ))}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alertRows.map((row) => (
                    <tr key={`alert-row-${row.id}`}>
                      {alertColumns.map((column) => (
                        <td key={`alert-${row.id}-${column.key}`} className={`col-${column.key}`}>
                          {column.key === 'scorms_alerta' ? (
                            <span>{formatDateDDMMYYYY(row.scorms_alerta)}</span>
                          ) : column.key === 'scorm_categoria' ? (
                            <span className="category-chip" style={getCategoryColor(row[column.key])}>
                              {row[column.key] || 'Sin categoría'}
                            </span>
                          ) : column.key === 'scorm_name' ? (
                            <span>{getOfficialName(row)}</span>
                          ) : column.key === 'scorm_code' ? (
                            <span>{getInternationalizedCode(row)}</span>
                          ) : (
                            <span>{row[column.key] || '-'}</span>
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="row-actions">
                          <button type="button" className="secondary action-button" onClick={() => openDetails(row)}>
                            Detalles
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {translationModalOpen && (
        <div className="modal-overlay" role="presentation" onClick={closeTranslationModal}>
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nueva-traduccion-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <h3 id="nueva-traduccion-titulo">Añadir traducción</h3>
                <p>{selectedTranslatableGroups.length} SCORM(s) en ES seleccionado(s)</p>
              </div>
              <button type="button" className="secondary" onClick={closeTranslationModal} disabled={translationSubmitting}>
                Cerrar
              </button>
            </header>

            <div className="details-grid details-grid-single">
              <label>
                <span>Idioma de traducción</span>
                <select
                  value={translationLanguage}
                  onChange={(event) => setTranslationLanguage(event.target.value)}
                  disabled={translationSubmitting}
                >
                  {availableLanguages
                    .filter((language) => language !== 'ES')
                    .map((language) => (
                      <option key={`translation-modal-language-${language}`} value={language}>
                        {language} · {LANGUAGE_LABELS[language] || language}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <div className="table-wrapper details-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Código destino</th>
                    <th>Nombre traducido</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTranslatableGroups.map((group) => (
                    <tr key={`translation-draft-${group.groupId}`}>
                      <td>{`${translationLanguage}-${group.code}`}</td>
                      <td>
                        <input
                          type="text"
                          value={translationNameDrafts[group.groupId] || ''}
                          onChange={(event) => updateTranslationNameDraft(group.groupId, event.target.value)}
                          placeholder="Nombre traducido"
                          disabled={translationSubmitting}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="modal-footer">
              <button type="button" className="secondary" onClick={closeTranslationModal} disabled={translationSubmitting}>
                Cancelar
              </button>
              <button type="button" onClick={submitCreateTranslations} disabled={translationSubmitting}>
                {translationSubmitting ? 'Creando...' : 'Crear traducciones'}
              </button>
            </footer>
          </div>
        </div>
      )}


      {activeRow && detailDraft && (
        <div className="modal-overlay" role="presentation" onClick={closeDetails}>
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <h3 id="detalle-titulo">{getOfficialName(detailDraft)}</h3>
                <p>{getInternationalizedCode(detailDraft)}</p>
              </div>
              <button type="button" className="secondary" onClick={closeDetails}>
                Cerrar
              </button>
            </header>

            <div className="table-wrapper details-table-wrapper">
              <table className="details-edit-table">
                <thead>
                  <tr>
                    <th>Campo</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.filter((column) => column.editable).map((column) => (
                    <tr key={`detail-${column.key}`}>
                      <td>{column.label}</td>
                      <td>
                        {column.key === 'scorm_responsable' ? (
                          <input
                            type="text"
                            value={detailDraft[column.key] || ''}
                            placeholder="Responsables separados por &"
                            onChange={(event) => updateDetailDraft(column.key, event.target.value)}
                          />
                        ) : (
                          <input
                            type="text"
                            value={detailDraft[column.key] || ''}
                            onChange={(event) => updateDetailDraft(column.key, event.target.value)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="modal-footer">
              <button type="button" className="secondary action-button" onClick={openHistoryModal}>
                Actualizaciones
              </button>
              <button type="button" className="secondary action-button" onClick={() => openUpdateModal(detailDraft)}>
                Actualizar SCORM
              </button>
              <button type="button" onClick={saveDetails}>
                Guardar detalles
              </button>
            </footer>
          </div>
        </div>
      )}

      {historyModalOpen && detailDraft && (
        <div className="modal-overlay" role="presentation" onClick={() => setHistoryModalOpen(false)}>
          <div
            className="modal-content modal-content-narrow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="historico-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <h3 id="historico-titulo">Histórico de actualizaciones</h3>
                <p>{getOfficialName(detailDraft)} · {getInternationalizedCode(detailDraft)}</p>
              </div>
              <button type="button" className="secondary" onClick={() => setHistoryModalOpen(false)}>
                Cerrar
              </button>
            </header>

            {historyLoading ? (
              <p className="status">Cargando histórico...</p>
            ) : historyRecords.length === 0 ? (
              <p className="status">No hay actualizaciones registradas para este SCORM.</p>
            ) : (
              <ul className="history-list">
                {historyRecords.map((record) => (
                  <li key={`history-${record.id}`}>
                    <strong>{record.cambio_tipo || 'Sin tipo de cambio'}</strong>
                    <span>
                      Fecha modificación:{' '}
                      {record.fecha_modif
                        ? new Date(record.fecha_modif).toLocaleDateString('es-ES')
                        : '-'}
                    </span>
                    <span>Usuario: {record.cambio_user || '-'}</span>
                    <span>Notas: {record.cambio_notas || '-'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {updateTargetRow && (
        <div className="modal-overlay" role="presentation" onClick={closeUpdateModal}>
          <div
            className="modal-content modal-content-narrow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="actualizacion-scorm-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <h3 id="actualizacion-scorm-titulo">Actualizar SCORM</h3>
                <p>
                  {updateTargetRows.length === 1
                    ? `${getOfficialName(updateTargetRow)} · ${getInternationalizedCode(updateTargetRow)}`
                    : `${updateTargetRows.length} SCORMs seleccionados para actualizar`}
                </p>
              </div>
              <button type="button" className="secondary" onClick={closeUpdateModal} disabled={updateSubmitting}>
                Cerrar
              </button>
            </header>

            <div className="details-grid details-grid-single">
              <label>
                <span>Tipo de cambio (obligatorio)</span>
                <select
                  value={updateForm.cambio_tipo}
                  onChange={(event) => updateUpdateFormField('cambio_tipo', event.target.value)}
                  required
                >
                  <option value="">Selecciona un tipo</option>
                  {UPDATE_TYPES.map((type) => (
                    <option key={`update-type-${type}`} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Fecha de modificación</span>
                <input
                  type="date"
                  value={updateForm.fecha_modif}
                  onChange={(event) => updateUpdateFormField('fecha_modif', event.target.value)}
                />
              </label>

              <label>
                <span>Usuario (opcional)</span>
                <input
                  type="text"
                  value={updateForm.cambio_user}
                  placeholder="Indicar manualmente"
                  onChange={(event) => updateUpdateFormField('cambio_user', event.target.value)}
                />
              </label>

              <label>
                <span>Notas (opcional)</span>
                <textarea
                  value={updateForm.cambio_notas}
                  placeholder="Notas del proceso de actualización"
                  onChange={(event) => updateUpdateFormField('cambio_notas', event.target.value)}
                />
              </label>
            </div>

            <footer className="modal-footer">
              <button type="button" onClick={submitScormUpdate} disabled={updateSubmitting}>
                {updateSubmitting ? 'Registrando...' : 'Registrar actualización'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {createDraft && (
        <div className="modal-overlay" role="presentation" onClick={closeCreateModal}>
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crear-scorm-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <h3 id="crear-scorm-titulo">Crear SCORM</h3>
                <p>Nuevo registro completo en scorms_master con código sugerido libre.</p>
              </div>
              <button type="button" className="secondary" onClick={closeCreateModal} disabled={createSubmitting}>
                Cerrar
              </button>
            </header>

            <div className="details-grid">
              {columns.filter((column) => column.editable).map((column) => (
                <label key={`create-${column.key}`}>
                  <span>{column.label}</span>
                  <input
                    type="text"
                    value={createDraft[column.key] || ''}
                    placeholder={column.key === 'scorm_responsable' ? 'Responsables separados por &' : ''}
                    onChange={(event) => updateCreateDraft(column.key, event.target.value)}
                  />
                </label>
              ))}
            </div>

            <footer className="modal-footer">
              <button type="button" onClick={submitCreateScorm} disabled={createSubmitting}>
                {createSubmitting ? 'Creando...' : 'Crear SCORM'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {coursesModalRow ? (
        <div className="modal-overlay" role="presentation" onClick={() => setCoursesModalRow(null)}>
          <section className="modal-content modal-content-large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h3>Cursos relacionados al SCORM</h3>
                <p>
                  {getOfficialName(coursesModalRow)} · {getInternationalizedCode(coursesModalRow)}
                </p>
              </div>
              <button type="button" className="secondary" onClick={() => setCoursesModalRow(null)}>
                Cerrar
              </button>
            </header>

            {modalIndividualCourseGroups.length === 0 ? (
              <p className="status">No hay cursos individuales relacionados para este SCORM.</p>
            ) : (
              <div className="scorms-accordion-list">
                {modalIndividualCourseGroups.map((individualGroup) => {
                  const level1CourseName =
                    individualGroup.rows.map((course) => String(course.curso_nombre || '').trim()).find(Boolean) || '-';
                  const coursesByCode = individualGroup.rows.reduce((acc, course) => {
                    const courseCode = String(course.curso_codigo || '').trim();
                    const courseName = String(course.curso_nombre || '').trim();
                    const key = courseCode || courseName || `curso-${course.id}`;

                    if (!acc[key]) {
                      acc[key] = {
                        key,
                        title: courseCode || courseName || `Curso ${course.id}`,
                        rows: [],
                      };
                    }

                    acc[key].rows.push(course);
                    return acc;
                  }, {});

                  const nestedCourses = Object.values(coursesByCode).sort((left, right) =>
                    left.title.localeCompare(right.title, 'es', { sensitivity: 'base' }),
                  );

                  return (
                    <details key={individualGroup.key} className="scorms-accordion-item course-level-1">
                      <summary>
                        <span className="course-summary-grid">
                          <strong>{level1CourseName}</strong>
                          <span>{individualGroup.label}</span>
                          <span>{individualGroup.rows.length} curso(s)</span>
                          <span>Nivel 1 · Curso individual</span>
                        </span>
                      </summary>

                      <div className="scorms-accordion-list">
                        {nestedCourses.map((courseGroup) => {
                          const level2CourseName =
                            courseGroup.rows.map((course) => String(course.curso_nombre || '').trim()).find(Boolean) || '-';
                          const orderedDetailKeys = [
                            ...new Set([
                              'curso_nombre',
                              ...Object.keys(courseGroup.rows[0] || {}).filter((key) => !['contenido', 'contenidos'].includes(key)),
                            ]),
                          ];

                          return (
                            <details key={`${individualGroup.key}-${courseGroup.key}`} className="scorms-accordion-item course-level-2">
                              <summary>
                                <span className="course-summary-grid">
                                  <span>{level2CourseName}</span>
                                  <span>{courseGroup.title}</span>
                                  <span>{courseGroup.rows.length} registro(s)</span>
                                  <span>Nivel 2 · Cursos</span>
                                </span>
                              </summary>

                              <details className="scorms-accordion-item course-level-3" open>
                                <summary>
                                  <span className="course-summary-grid">
                                    <span>Detalles</span>
                                    <span>{level2CourseName}</span>
                                    <span>Tabla de campos</span>
                                    <span>Nivel 3</span>
                                  </span>
                                </summary>

                                <div className="table-wrapper details-table-wrapper">
                                  <table className="details-edit-table">
                                    <thead>
                                      <tr>
                                        <th>Campo</th>
                                        {courseGroup.rows.map((course) => (
                                          <th key={`${courseGroup.key}-header-${course.id}`}>
                                            {String(course.curso_nombre || course.curso_codigo || `Registro ${course.id}`)}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {orderedDetailKeys.map((key) => (
                                        <tr key={`${courseGroup.key}-${key}`}>
                                          <td>{formatFieldLabel(key)}</td>
                                          {courseGroup.rows.map((course) => (
                                            <td key={`${course.id}-${key}`}>{String(course[key] || '-')}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </details>
                            </details>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
