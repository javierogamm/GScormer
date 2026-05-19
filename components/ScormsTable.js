'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { APP_VERSION } from '../lib/appVersion';
import { exportRowsToExcel } from '../lib/excelExport';
import { getScormImportKey, parseScormExcelRows } from '../lib/scormExcelImport';

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
  { key: 'scorm_etiquetas', label: 'Etiquetas', editable: false },
  { key: 'scorm_observaciones', label: 'Observaciones', editable: true },
];

const FILTER_LAYOUT_ROWS = [
  ['scorm_code', 'scorm_name'],
  ['scorm_responsable', 'scorm_categoria', 'scorm_estado', 'scorm_test', 'scorm_idioma'],
];

const FILTER_SELECT_KEYS = columns.map((column) => column.key);

const FILTER_LABELS = {
  scorm_categoria: 'Clasificación',
  scorm_etiquetas: 'Etiquetas',
};

const SCORM_SELECTOR_FIELDS = ['scorm_responsable', 'scorm_tipo', 'scorm_categoria', 'scorm_subcategoria', 'scorm_estado', 'scorm_test'];
const NEW_SELECTOR_OPTION_VALUE = '__new_option__';
const ADMIN_MANAGED_SELECTOR_FIELDS = ['scorm_categoria', 'scorm_subcategoria'];
const ALLOW_NEW_SELECTOR_FIELDS = SCORM_SELECTOR_FIELDS.filter((fieldKey) => fieldKey !== 'scorm_subcategoria');
const REQUIRED_CREATE_FIELDS = ['scorm_name', 'scorm_url', 'scorm_test'];

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

const STATUS_ORDER = ['En proceso', 'Pendiente de validación', 'Pendiente de publicar', 'Publicado', 'Actualizado pendiente de publicar', 'Rechazado'];
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
const VALIDATION_PENDING_STATE = 'Pendiente de validación';
const REJECTED_STATE = 'Rechazado';
const CREATOR_COLUMN = { key: '__creator__', label: 'Usuario creador', editable: false };
const MY_VALIDATIONS_COLUMNS = [CREATOR_COLUMN, ...publishColumns];
const MY_SCORMS_VIEW_LABEL = 'MIS VALIDACIONES';
const MY_SCORMS_STATES = [...PUBLISH_PENDING_STATES, VALIDATION_PENDING_STATE, REJECTED_STATE];
const SCORM_CODE_REGEX = /(?:\b([a-z]{2,3})\s*[-_]\s*)?\b(SCR\d{4})\b/gi;

const normalizeLanguage = (language) => {
  const normalized = String(language || '').trim().toUpperCase();

  if (normalized === 'CA') {
    return 'CAT';
  }

  return normalized;
};

const normalizeFilterLookupText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

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

const getRejectionComment = (row) => String(row?.scorm_rechazo || row?.scorm_rechazo_comentario || '').trim();

const getRejectionUser = (row) => String(row?.scorm_rechazo_user || '').trim();

const getRejectionDate = (row) => row?.scorm_rechazo_fecha || null;

const getCreatorUser = (row) =>
  String(row?.scorm_creador || row?.scorm_created_by || row?.scorm_usuario || row?.scorm_user || '').trim();

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

const getAlertDateValue = (row) => row.scorms_alerta || row.scorm_alerta || null;

const getExternalUrl = (rawValue) => {
  const trimmedValue = String(rawValue || '').trim();
  if (!trimmedValue) {
    return '';
  }

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmedValue) || trimmedValue.startsWith('//')) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
};

const parseTagCodesFromInput = (value) =>
  [...new Set(String(value || '')
    .split(/[\s,;\n\t]+/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean))];

const stringifyTagCodes = (values = []) => values.join(';');

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
  const [openFilterLookupKey, setOpenFilterLookupKey] = useState(null);
  const [filterDraftSelections, setFilterDraftSelections] = useState({});
  const [filterLookupSearchInputs, setFilterLookupSearchInputs] = useState({});
  const [viewMode, setViewMode] = useState('table');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkEditSubmitting, setBulkEditSubmitting] = useState(false);
  const [bulkEditDraft, setBulkEditDraft] = useState({
    scorm_responsable: '',
    scorm_tipo: '',
    scorm_categoria: '',
    scorm_subcategoria: '',
    scorm_test: '',
  });
  const [expandedCardIds, setExpandedCardIds] = useState([]);
  const [dragOverState, setDragOverState] = useState('');
  const [draggedRowIds, setDraggedRowIds] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const [alertActionsHistory, setAlertActionsHistory] = useState([]);
  const [alertRedoHistory, setAlertRedoHistory] = useState([]);
  const [alertRecords, setAlertRecords] = useState([]);
  const [tagCatalogRows, setTagCatalogRows] = useState([]);
  const [expandedAlertTags, setExpandedAlertTags] = useState({});
  const [translationPreset, setTranslationPreset] = useState('todos');
  const [pendingLanguage, setPendingLanguage] = useState('ES');
  const [translationModalOpen, setTranslationModalOpen] = useState(false);
  const [translationSubmitting, setTranslationSubmitting] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState('CAT');
  const [selectedTranslationGroupIds, setSelectedTranslationGroupIds] = useState([]);
  const [translationNameDrafts, setTranslationNameDrafts] = useState({});
  const [updateTargetRow, setUpdateTargetRow] = useState(null);
  const [updateTargetRows, setUpdateTargetRows] = useState([]);
  const [updateModalOptions, setUpdateModalOptions] = useState({ clearAlertOnSubmit: false, source: 'general' });
  const [updateForm, setUpdateForm] = useState({
    cambio_tipo: '',
    fecha_modif: new Date().toISOString().slice(0, 10),
    cambio_user: '',
    cambio_notas: '',
  });
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [createDraft, setCreateDraft] = useState(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [customSelectorOptionsByField, setCustomSelectorOptionsByField] = useState({});
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [detailLatestUpdate, setDetailLatestUpdate] = useState(null);
  const [detailLatestUpdateDraft, setDetailLatestUpdateDraft] = useState('');
  const [detailLatestUpdateLoading, setDetailLatestUpdateLoading] = useState(false);
  const [publishPreset, setPublishPreset] = useState('todos');
  const [selectedPublishIds, setSelectedPublishIds] = useState([]);
  const [selectedValidationIds, setSelectedValidationIds] = useState([]);
  const [rejectionTargetRows, setRejectionTargetRows] = useState([]);
  const [rejectionComment, setRejectionComment] = useState('');
  const [rejectionSubmitting, setRejectionSubmitting] = useState(false);
  const [commentsModalRow, setCommentsModalRow] = useState(null);
  const [latestUpdateByCode, setLatestUpdateByCode] = useState({});
  const [publishDateSortDirection, setPublishDateSortDirection] = useState('desc');
  const [coursesRows, setCoursesRows] = useState([]);
  const [coursesModalRow, setCoursesModalRow] = useState(null);
  const [tagManagerModalOpen, setTagManagerModalOpen] = useState(false);
  const [tagManagerSearch, setTagManagerSearch] = useState('');
  const [tagManagerDraft, setTagManagerDraft] = useState({ etiqueta_codigo: '', etiqueta_nombre: '', clasificacion_scorm: '' });
  const [tagManagerSubmitting, setTagManagerSubmitting] = useState(false);
  const [singleTagPickerOpen, setSingleTagPickerOpen] = useState(false);
  const [singleTagPickerSearch, setSingleTagPickerSearch] = useState('');
  const [singleTagPickerDraft, setSingleTagPickerDraft] = useState([]);
  const [suggestedTagsModalOpen, setSuggestedTagsModalOpen] = useState(false);
  const [suggestedTagDraft, setSuggestedTagDraft] = useState([]);
  const [singleTagSubmitting, setSingleTagSubmitting] = useState(false);
  const [bulkTagPickerOpen, setBulkTagPickerOpen] = useState(false);
  const [bulkTagPickerSearch, setBulkTagPickerSearch] = useState('');
  const [bulkTagPickerDraft, setBulkTagPickerDraft] = useState([]);
  const [alertGeneratorModalOpen, setAlertGeneratorModalOpen] = useState(false);
  const [alertCodesDraft, setAlertCodesDraft] = useState('');
  const [alertNovedadDraft, setAlertNovedadDraft] = useState('');
  const [alertUrlDraft, setAlertUrlDraft] = useState('');
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [myScormsOnly, setMyScormsOnly] = useState(false);
  const [testQuestionsModalRow, setTestQuestionsModalRow] = useState(null);
  const [testQuestionsDraft, setTestQuestionsDraft] = useState('');
  const [testQuestionsSubmitting, setTestQuestionsSubmitting] = useState(false);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importPreviewRows, setImportPreviewRows] = useState([]);
  const [importPreviewDuplicates, setImportPreviewDuplicates] = useState([]);
  const [importPreviewRestrictedRows, setImportPreviewRestrictedRows] = useState([]);
  const [importPreviewFileName, setImportPreviewFileName] = useState('');
  const [importPreviewModalOpen, setImportPreviewModalOpen] = useState(false);
  const importFileInputRef = useRef(null);
  const scopedResponsibleAgents = userSession?.agentFilters?.responsables || [];
  const canPublishAsAdmin = userSession?.admin === true;
  const canAccessPublishView = Boolean(userSession);
  const canValidateScorms = userSession?.validador === true;
  const canAccessValidationView = canPublishAsAdmin || canValidateScorms;
  const canMoveToPendingPublish = canValidateScorms;
  const canDeleteAsAdmin = userSession?.admin === true;
  const canGenerateAlerts = userSession?.alertador === true;
  const defaultUpdateUser = String(userSession?.name || '').trim();
  const canUseMyScormsTray = canPublishAsAdmin || scopedResponsibleAgents.length > 0;
  const canRejectScorm = (row) => {
    const rowState = getRowState(row);

    if (PUBLISH_PENDING_STATES.includes(rowState)) {
      return canPublishAsAdmin;
    }

    if (rowState === VALIDATION_PENDING_STATE) {
      return canMoveToPendingPublish;
    }

    return false;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    const [masterResponse, updatesResponse, cursosResponse, alertasResponse, etiquetasResponse] = await Promise.all([
      supabase.from('scorms_master').select('*').order('id', { ascending: true }),
      supabase.from('scorms_actualizacion').select('scorm_codigo, cambio_tipo, fecha_modif, created_at'),
      supabase.from('scorms_cursos').select('*').order('id', { ascending: true }),
      supabase.from('scorms_alertas').select('*').order('alerta_fecha', { ascending: false }).order('id', { ascending: false }),
      supabase.from('scorms_etiquetas').select('etiqueta_codigo, etiqueta_nombre, clasificacion_scorm'),
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

    if (alertasResponse.error) {
      setAlertRecords([]);
      setError((previous) => previous || `No se pudieron cargar las alertas: ${alertasResponse.error.message}`);
    } else {
      setAlertRecords(alertasResponse.data || []);
    }

    if (etiquetasResponse.error) {
      setTagCatalogRows([]);
      setError((previous) => previous || `No se pudieron cargar las etiquetas: ${etiquetasResponse.error.message}`);
    } else {
      setTagCatalogRows(etiquetasResponse.data || []);
    }

    setRows(masterResponse.data || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!activeRow) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeRow]);

  useEffect(() => {
    const scormCode = String(detailDraft?.scorm_code || '').trim();

    if (!activeRow || !scormCode) {
      setDetailLatestUpdate(null);
      setDetailLatestUpdateLoading(false);
      return undefined;
    }

    let ignore = false;

    const fetchLatestUpdateForDetail = async () => {
      setDetailLatestUpdateLoading(true);

      const { data, error: latestUpdateError } = await supabase
        .from('scorms_actualizacion')
        .select('id, cambio_tipo, cambio_user, cambio_notas, fecha_modif, created_at')
        .eq('scorm_codigo', scormCode)
        .order('fecha_modif', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ignore) {
        return;
      }

      if (latestUpdateError) {
        setDetailLatestUpdate(null);
        setDetailLatestUpdateLoading(false);
        setError((previous) => previous || `No se pudo cargar la última actualización del SCORM: ${latestUpdateError.message}`);
        return;
      }

      setDetailLatestUpdate(data || null);
      setDetailLatestUpdateDraft(String(data?.cambio_notas || ''));
      setDetailLatestUpdateLoading(false);
    };

    fetchLatestUpdateForDetail();

    return () => {
      ignore = true;
    };
  }, [activeRow, detailDraft?.scorm_code]);

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

  const activeFilterCount = useMemo(() => Object.values(filters).flat().length, [filters]);

  const filterOptionsByColumn = useMemo(() => {
    return FILTER_SELECT_KEYS.reduce((acc, key) => {
      const uniqueValues = [
        ...new Set(
          rows
            .map((row) => {
              if (key === 'scorm_name') {
                return getOfficialName(row);
              }

              if (key === 'scorm_code') {
                return getInternationalizedCode(row);
              }

              if (key === 'scorm_etiquetas') {
                return parseTagCodesFromInput(String(row[key] || '').replace(/;/g, ' '));
              }

              return String(row[key] || '').trim();
            })
            .flat()
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
      acc[key] = uniqueValues;
      return acc;
    }, {});
  }, [rows]);

  const selectorOptionsByField = useMemo(() => {
    return SCORM_SELECTOR_FIELDS.reduce((acc, fieldKey) => {
      const values = [
        ...rows.map((row) => String(row[fieldKey] || '').trim()).filter(Boolean),
        ...(customSelectorOptionsByField[fieldKey] || []),
      ];

      if (fieldKey === 'scorm_estado') {
        values.push(...STATUS_ORDER);
      }

      acc[fieldKey] = [...new Set(values)].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
      return acc;
    }, {});
  }, [customSelectorOptionsByField, rows]);

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

  const pendingValidationRows = useMemo(
    () => filteredRows.filter((row) => getRowState(row) === VALIDATION_PENDING_STATE),
    [filteredRows],
  );

  const myScormRows = useMemo(
    () =>
      rows
        .filter((row) => canPublishAsAdmin || rowHasResponsibleAgents(row, scopedResponsibleAgents))
        .filter((row) => MY_SCORMS_STATES.includes(getRowState(row)))
        .sort((left, right) => {
          const leftRejected = getRowState(left) === REJECTED_STATE ? 0 : 1;
          const rightRejected = getRowState(right) === REJECTED_STATE ? 0 : 1;

          if (leftRejected !== rightRejected) {
            return leftRejected - rightRejected;
          }

          return getInternationalizedCode(left).localeCompare(getInternationalizedCode(right));
        }),
    [canPublishAsAdmin, rows, scopedResponsibleAgents],
  );

  useEffect(() => {
    const pendingIds = new Set(pendingPublishRows.map((row) => row.id));
    setSelectedPublishIds((previous) => previous.filter((rowId) => pendingIds.has(rowId)));
  }, [pendingPublishRows]);

  useEffect(() => {
    const pendingIds = new Set(pendingValidationRows.map((row) => row.id));
    setSelectedValidationIds((previous) => previous.filter((rowId) => pendingIds.has(rowId)));
  }, [pendingValidationRows]);

  const tagsByCode = useMemo(() => {
    return tagCatalogRows.reduce((acc, tagRow) => {
      const code = String(tagRow.etiqueta_codigo || '').trim().toUpperCase();
      if (!code) {
        return acc;
      }

      if (!acc[code]) {
        acc[code] = [];
      }

      acc[code].push(tagRow);
      return acc;
    }, {});
  }, [tagCatalogRows]);

  const tagCatalogFilteredRows = useMemo(() => {
    const lookup = normalizeFilterLookupText(tagManagerSearch);
    if (!lookup) {
      return tagCatalogRows;
    }
    return tagCatalogRows.filter((row) =>
      [row.etiqueta_codigo, row.etiqueta_nombre, row.clasificacion_scorm].some((value) =>
        normalizeFilterLookupText(value).includes(lookup),
      ),
    );
  }, [tagCatalogRows, tagManagerSearch]);
  const singleTagPickerRows = useMemo(() => {
    const lookup = normalizeFilterLookupText(singleTagPickerSearch);
    if (!lookup) return tagCatalogRows;
    return tagCatalogRows.filter((row) =>
      [row.etiqueta_codigo, row.etiqueta_nombre, row.clasificacion_scorm].some((value) => normalizeFilterLookupText(value).includes(lookup)),
    );
  }, [singleTagPickerSearch, tagCatalogRows]);
  const bulkTagPickerRows = useMemo(() => {
    const lookup = normalizeFilterLookupText(bulkTagPickerSearch);
    if (!lookup) return tagCatalogRows;
    return tagCatalogRows.filter((row) =>
      [row.etiqueta_codigo, row.etiqueta_nombre, row.clasificacion_scorm].some((value) => normalizeFilterLookupText(value).includes(lookup)),
    );
  }, [bulkTagPickerSearch, tagCatalogRows]);
  const selectedSingleTagRows = useMemo(
    () =>
      singleTagPickerDraft
        .map((code) => (tagsByCode[code] || [])[0] || { etiqueta_codigo: code, etiqueta_nombre: '', clasificacion_scorm: '' }),
    [singleTagPickerDraft, tagsByCode],
  );
  const suggestedTagRows = useMemo(() => {
    const scormClassification = String(coursesModalRow?.scorm_categoria || '').trim();
    if (!scormClassification) {
      return [];
    }

    return tagCatalogRows
      .filter((row) => String(row.clasificacion_scorm || '').trim() === scormClassification)
      .sort((left, right) => String(left.etiqueta_codigo || '').localeCompare(String(right.etiqueta_codigo || ''), 'es', { sensitivity: 'base' }));
  }, [coursesModalRow?.scorm_categoria, tagCatalogRows]);
  const selectedBulkTagRows = useMemo(
    () =>
      bulkTagPickerDraft
        .map((code) => (tagsByCode[code] || [])[0] || { etiqueta_codigo: code, etiqueta_nombre: '', clasificacion_scorm: '' }),
    [bulkTagPickerDraft, tagsByCode],
  );

  const getTagRowsForScorm = useCallback(
    (row) => {
      const tagCodes = parseTagCodesFromInput(String(row.scorm_etiquetas || '').replace(/;/g, ' '));
      return tagCodes.map((code) => {
        const catalogRow = (tagsByCode[code] || [])[0] || {};
        return {
          etiqueta_codigo: code,
          etiqueta_nombre: catalogRow.etiqueta_nombre || '',
          clasificacion_scorm: catalogRow.clasificacion_scorm || '',
        };
      });
    },
    [tagsByCode],
  );

  const alertsByScormCode = useMemo(() => {
    const scormRowsByCode = filteredRows.reduce((acc, row) => {
      const code = String(row.scorm_code || '').trim().toUpperCase();
      if (!code) {
        return acc;
      }

      if (!acc[code]) {
        acc[code] = [];
      }
      acc[code].push(row);
      return acc;
    }, {});

    const groups = (alertRecords || []).reduce((acc, alertRow) => {
      const scormCode = String(alertRow.scorm_codigo || '').trim().toUpperCase();
      if (!scormCode || !scormRowsByCode[scormCode] || scormRowsByCode[scormCode].length === 0) {
        return acc;
      }

      if (!acc[scormCode]) {
        acc[scormCode] = [];
      }
      acc[scormCode].push(alertRow);
      return acc;
    }, {});

    return Object.entries(groups)
      .map(([scormCode, alerts]) => {
        const matchedRows = scormRowsByCode[scormCode] || [];
        const representativeRow = matchedRows[0] || null;
        const sortedAlerts = [...alerts].sort((left, right) => {
          const leftMs = getDateMsFromCandidates([left.alerta_fecha, left.created_at]);
          const rightMs = getDateMsFromCandidates([right.alerta_fecha, right.created_at]);
          return (rightMs || 0) - (leftMs || 0);
        });
        const latestAlert = sortedAlerts[0] || null;

        return {
          scormCode,
          scormName: representativeRow ? getOfficialName(representativeRow) : 'Sin nombre',
          scormClassification: representativeRow ? String(representativeRow.scorm_categoria || '').trim() : '',
          relatedRows: matchedRows,
          lastAlertDate: latestAlert?.alerta_fecha || latestAlert?.created_at || null,
          alertCount: sortedAlerts.length,
          alerts: sortedAlerts,
        };
      })
      .sort((left, right) => {
        const leftMs = getDateMsFromCandidates([left.lastAlertDate]);
        const rightMs = getDateMsFromCandidates([right.lastAlertDate]);
        if (leftMs && rightMs && leftMs !== rightMs) {
          return rightMs - leftMs;
        }
        return left.scormCode.localeCompare(right.scormCode);
      });
  }, [alertRecords, filteredRows]);

  const alertScormsIndividualCount = useMemo(
    () => alertsByScormCode.reduce((acc, group) => acc + (group.relatedRows?.length || 0), 0),
    [alertsByScormCode],
  );

  const publishUpdatesCount = pendingPublishRows.filter((row) => getRowState(row) === 'Actualizado pendiente de publicar').length;
  const publishPendingCount = pendingPublishRows.filter((row) => getRowState(row) === 'Pendiente de publicar').length;
  const validationPendingCount = pendingValidationRows.length;
  const hasItemsPendingPublication = pendingPublishRows.length > 0;
  const hasItemsPendingValidation = pendingValidationRows.length > 0;
  const myScormRowsCount = myScormRows.length;

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

  const openFilterLookup = (field) => {
    setFilterDraftSelections((previous) => ({
      ...previous,
      [field]: filters[field] || [],
    }));
    setFilterLookupSearchInputs((previous) => ({
      ...previous,
      [field]: previous[field] || '',
    }));
    setOpenFilterLookupKey((previous) => (previous === field ? null : field));
  };

  const handleFilterLookupSearchChange = (field, value) => {
    setFilterLookupSearchInputs((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleDraftFilterSelection = (field, option) => {
    setFilterDraftSelections((previous) => {
      const existingValues = previous[field] || [];
      const alreadySelected = existingValues.some((value) => value.toLowerCase() === option.toLowerCase());

      return {
        ...previous,
        [field]: alreadySelected
          ? existingValues.filter((value) => value.toLowerCase() !== option.toLowerCase())
          : [...existingValues, option],
      };
    });
  };

  const applyLookupFilterValues = (field, selectedValues) => {
    setFilters((previous) => {
      if (selectedValues.length === 0) {
        const { [field]: _removed, ...rest } = previous;
        return rest;
      }

      return {
        ...previous,
        [field]: selectedValues,
      };
    });
    setOpenFilterLookupKey(null);
  };

  const applyLookupFilter = (field) => {
    applyLookupFilterValues(field, filterDraftSelections[field] || []);
  };

  const applyMatchingLookupFilter = (field) => {
    const normalizedSearch = normalizeFilterLookupText(filterLookupSearchInputs[field]);
    const matchingOptions = (filterOptionsByColumn[field] || []).filter((option) => {
      if (!normalizedSearch) {
        return true;
      }

      return normalizeFilterLookupText(option).includes(normalizedSearch);
    });

    if (matchingOptions.length === 0) {
      return;
    }

    const selectedValues = [...(filterDraftSelections[field] || [])];

    matchingOptions.forEach((option) => {
      const alreadySelected = selectedValues.some((value) => value.toLowerCase() === option.toLowerCase());
      if (!alreadySelected) {
        selectedValues.push(option);
      }
    });

    setFilterDraftSelections((previous) => ({
      ...previous,
      [field]: selectedValues,
    }));
    applyLookupFilterValues(field, selectedValues);
  };

  const clearDraftLookupFilter = (field) => {
    setFilterDraftSelections((previous) => ({
      ...previous,
      [field]: [],
    }));
    setFilterLookupSearchInputs((previous) => ({
      ...previous,
      [field]: '',
    }));
    clearFieldFilters(field);
  };

  const clearAllFilters = () => {
    setFilters({});
    setFilterInputs({});
    setFilterDraftSelections({});
    setFilterLookupSearchInputs({});
    setOpenFilterLookupKey(null);
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
    setDetailLatestUpdate(null);
    setDetailLatestUpdateDraft('');
    setDetailLatestUpdateLoading(false);
    setHistoryModalOpen(false);
    setHistoryRecords([]);
    setHistoryLoading(false);
  };

  const openTestQuestionsModal = (row) => {
    if (!row?.id) {
      return;
    }

    setError('');
    setStatusMessage('');
    setTestQuestionsModalRow(row);
    setTestQuestionsDraft(String(row.scorm_preguntastest || ''));
  };

  const closeTestQuestionsModal = () => {
    if (testQuestionsSubmitting) {
      return;
    }

    setTestQuestionsModalRow(null);
    setTestQuestionsDraft('');
  };

  const saveTestQuestions = async () => {
    if (!testQuestionsModalRow?.id) {
      return;
    }

    setTestQuestionsSubmitting(true);
    setError('');
    setStatusMessage('');

    const normalizedQuestions = String(testQuestionsDraft || '').trim();
    const payload = {
      scorm_preguntastest: normalizedQuestions ? testQuestionsDraft : null,
    };

    if (normalizedQuestions) {
      payload.scorm_test = 'Sí';
    }

    const { error: updateError } = await supabase
      .from('scorms_master')
      .update(payload)
      .eq('id', testQuestionsModalRow.id);

    if (updateError) {
      setTestQuestionsSubmitting(false);
      setError(`No se pudieron guardar las preguntas tipo test: ${updateError.message}`);
      return;
    }

    setRows((previousRows) =>
      previousRows.map((row) => (row.id === testQuestionsModalRow.id ? { ...row, ...payload } : row))
    );

    setActiveRow((previous) =>
      previous?.id === testQuestionsModalRow.id ? { ...previous, ...payload } : previous
    );

    setDetailDraft((previous) =>
      previous?.id === testQuestionsModalRow.id ? { ...previous, ...payload } : previous
    );

    setTestQuestionsSubmitting(false);
    setStatusMessage(`Preguntas tipo test del SCORM ${testQuestionsModalRow.id} guardadas correctamente.`);
    closeTestQuestionsModal();
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

  const openUpdateModal = (rowsToUpdate, options = { clearAlertOnSubmit: false, source: 'general' }) => {
    const normalizedRows = Array.isArray(rowsToUpdate) ? rowsToUpdate : [rowsToUpdate];
    const validRows = normalizedRows.filter(Boolean);

    if (validRows.length === 0) {
      return;
    }

    setError('');
    setStatusMessage('');
    setUpdateTargetRows(validRows);
    setUpdateTargetRow(validRows[0]);
    setUpdateModalOptions({
      clearAlertOnSubmit: options?.clearAlertOnSubmit === true,
      source: options?.source || 'general',
    });
    setUpdateForm({
      cambio_tipo: '',
      fecha_modif: new Date().toISOString().slice(0, 10),
      cambio_user: defaultUpdateUser,
      cambio_notas: '',
    });
  };

  const closeUpdateModal = () => {
    if (updateSubmitting) {
      return;
    }

    setUpdateTargetRow(null);
    setUpdateTargetRows([]);
    setUpdateModalOptions({ clearAlertOnSubmit: false, source: 'general' });
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
      scorm_observaciones: '',
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

  const canAddNewSelectorValue = (fieldKey) => {
    if (ADMIN_MANAGED_SELECTOR_FIELDS.includes(fieldKey)) {
      return canPublishAsAdmin;
    }

    return ALLOW_NEW_SELECTOR_FIELDS.includes(fieldKey);
  };

  const resolveNewSelectorValue = (fieldKey) => {
    if (!canAddNewSelectorValue(fieldKey)) {
      setStatusMessage('');
      setError('Solo los usuarios ADMIN pueden crear nuevas categorías o subcategorías.');
      return null;
    }

    const fieldLabel = columns.find((column) => column.key === fieldKey)?.label || fieldKey;
    const typedValue = globalThis?.prompt(`Nuevo valor para ${fieldLabel}:`);
    const normalizedValue = String(typedValue || '').trim();

    if (!normalizedValue) {
      return null;
    }

    setCustomSelectorOptionsByField((previous) => {
      const previousValues = previous[fieldKey] || [];
      const alreadyExists = previousValues.some((value) => value.toLowerCase() === normalizedValue.toLowerCase());

      if (alreadyExists) {
        return previous;
      }

      return {
        ...previous,
        [fieldKey]: [...previousValues, normalizedValue],
      };
    });

    return normalizedValue;
  };

  const handleSelectorFieldChange = (scope, fieldKey, nextValue) => {
    if (nextValue === NEW_SELECTOR_OPTION_VALUE) {
      const newValue = resolveNewSelectorValue(fieldKey);
      if (!newValue) {
        return;
      }

      if (scope === 'detail') {
        updateDetailDraft(fieldKey, newValue);
      } else {
        updateCreateDraft(fieldKey, newValue);
      }
      return;
    }

    if (scope === 'detail') {
      updateDetailDraft(fieldKey, nextValue);
      return;
    }

    updateCreateDraft(fieldKey, nextValue);
  };

  const saveDetails = async () => {
    if (!detailDraft?.id) {
      return;
    }

    const currentStoredRow = rows.find((row) => row.id === detailDraft.id) || activeRow || null;
    const previousState = String(currentStoredRow?.scorm_estado || '').trim();

    const payload = editableColumns.reduce((acc, key) => {
      acc[key] = detailDraft[key] || null;
      return acc;
    }, {});

    const nextState = String(payload.scorm_estado || '').trim();
    const isChangingToPublished = nextState === 'Publicado' && previousState !== 'Publicado';
    const isChangingToPendingPublish = nextState === 'Pendiente de publicar' && previousState !== 'Pendiente de publicar';

    if (isChangingToPublished && !canPublishAsAdmin) {
      setStatusMessage('');
      setError('Solo los usuarios ADMIN pueden poner un SCORM en estado "Publicado".');
      return;
    }

    if (isChangingToPendingPublish && !canMoveToPendingPublish) {
      setStatusMessage('');
      setError('Solo los usuarios validador pueden pasar SCORMs a "Pendiente de publicar".');
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

    const normalizedLatestNotes = String(detailLatestUpdateDraft || '').trim();
    const previousLatestNotes = String(detailLatestUpdate?.cambio_notas || '').trim();
    const normalizedScormCode = String(detailDraft.scorm_code || '').trim();

    if (normalizedLatestNotes !== previousLatestNotes) {
      let latestUpdateSaveError = null;
      let latestUpdateRecord = detailLatestUpdate;

      if (detailLatestUpdate?.id) {
        const response = await supabase
          .from('scorms_actualizacion')
          .update({
            cambio_notas: normalizedLatestNotes || null,
          })
          .eq('id', detailLatestUpdate.id)
          .select('id, cambio_tipo, cambio_user, cambio_notas, fecha_modif, created_at')
          .maybeSingle();

        latestUpdateSaveError = response.error;
        latestUpdateRecord = response.data || latestUpdateRecord;
      } else if (normalizedLatestNotes && normalizedScormCode) {
        const response = await supabase
          .from('scorms_actualizacion')
          .insert({
            scorm_codigo: normalizedScormCode,
            cambio_tipo: detailDraft.scorm_estado === 'Actualizado pendiente de publicar' ? 'Pendiente de actualización' : null,
            fecha_modif: new Date().toISOString().slice(0, 10),
            cambio_user: defaultUpdateUser || null,
            cambio_notas: normalizedLatestNotes,
          })
          .select('id, cambio_tipo, cambio_user, cambio_notas, fecha_modif, created_at')
          .maybeSingle();

        latestUpdateSaveError = response.error;
        latestUpdateRecord = response.data || latestUpdateRecord;
      }

      if (latestUpdateSaveError) {
        setStatusMessage('');
        setError(`Se guardó el SCORM, pero no se pudieron actualizar las notas del cambio: ${latestUpdateSaveError.message}`);
        return;
      }

      setDetailLatestUpdate(latestUpdateRecord || null);
    }

    setRows((previousRows) =>
      previousRows.map((row) => (row.id === detailDraft.id ? { ...row, ...detailDraft } : row))
    );
    setActiveRow((previous) => (previous ? { ...previous, ...detailDraft } : previous));
    setDetailLatestUpdate((previous) => (
      previous
        ? {
            ...previous,
            cambio_notas: normalizedLatestNotes || null,
          }
        : previous
    ));
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

  const openBulkEditModal = () => {
    if (!canPublishAsAdmin || selectedIds.length < 2) {
      return;
    }
    setBulkEditDraft({
      scorm_responsable: '',
      scorm_tipo: '',
      scorm_categoria: '',
      scorm_subcategoria: '',
      scorm_test: '',
    });
    setBulkEditModalOpen(true);
    setError('');
    setStatusMessage('');
  };

  const closeBulkEditModal = () => {
    if (bulkEditSubmitting) {
      return;
    }
    setBulkEditModalOpen(false);
    setBulkTagPickerOpen(false);
  };

  const toggleTagCodeInDraft = (setter, code) => {
    setter((previous) => (previous.includes(code) ? previous.filter((item) => item !== code) : [...previous, code]));
  };

  const submitBulkEdit = async () => {
    const selectedRows = rows.filter((row) => selectedIds.includes(row.id));
    if (selectedRows.length < 2) {
      setError('Debes seleccionar al menos 2 SCORMs para editar en masa.');
      return;
    }

    const payload = Object.entries(bulkEditDraft).reduce((acc, [key, value]) => {
      const normalized = String(value || '').trim();
      if (normalized) {
        acc[key] = normalized;
      }
      return acc;
    }, {});

    if (Object.keys(payload).length === 0) {
      setError('Debes informar al menos un campo para aplicar la edición masiva.');
      return;
    }

    setBulkEditSubmitting(true);
    setError('');
    setStatusMessage('');

    const selectedRowIds = selectedRows.map((row) => row.id);
    const { error: updateError } = await supabase.from('scorms_master').update(payload).in('id', selectedRowIds);

    if (updateError) {
      setBulkEditSubmitting(false);
      setError(`No se pudo completar la edición masiva de SCORMs: ${updateError.message}`);
      return;
    }

    setRows((previousRows) =>
      previousRows.map((row) => (selectedRowIds.includes(row.id) ? { ...row, ...payload } : row)),
    );
    setActiveRow((previous) => (previous && selectedRowIds.includes(previous.id) ? { ...previous, ...payload } : previous));
    setDetailDraft((previous) => (previous && selectedRowIds.includes(previous.id) ? { ...previous, ...payload } : previous));
    setBulkEditSubmitting(false);
    setBulkEditModalOpen(false);
    setStatusMessage(`Edición masiva aplicada a ${selectedRowIds.length} SCORM(s).`);
  };

  const applyBulkTags = async () => {
    const selectedRows = rows.filter((row) => selectedIds.includes(row.id));
    if (selectedRows.length < 2 || bulkTagPickerDraft.length === 0) {
      return;
    }
    setBulkEditSubmitting(true);
    const updates = selectedRows.map((row) => {
      const currentCodes = parseTagCodesFromInput(String(row.scorm_etiquetas || '').replace(/;/g, ' '));
      const merged = [...new Set([...currentCodes, ...bulkTagPickerDraft])];
      return { id: row.id, scorm_etiquetas: stringifyTagCodes(merged) };
    });
    for (const item of updates) {
      const { error: updateError } = await supabase.from('scorms_master').update({ scorm_etiquetas: item.scorm_etiquetas }).eq('id', item.id);
      if (updateError) {
        setBulkEditSubmitting(false);
        setError(`No se pudo aplicar etiquetas en masa: ${updateError.message}`);
        return;
      }
    }
    setRows((previousRows) => previousRows.map((row) => {
      const updated = updates.find((item) => item.id === row.id);
      return updated ? { ...row, scorm_etiquetas: updated.scorm_etiquetas } : row;
    }));
    setBulkEditSubmitting(false);
    setBulkTagPickerOpen(false);
    setBulkTagPickerDraft([]);
    setStatusMessage(`Etiquetas añadidas a ${updates.length} SCORM(s).`);
  };

  const saveSingleScormTags = async () => {
    if (!coursesModalRow || singleTagPickerDraft.length === 0) {
      return;
    }
    const currentCodes = parseTagCodesFromInput(String(coursesModalRow.scorm_etiquetas || '').replace(/;/g, ' '));
    const merged = [...new Set([...currentCodes, ...singleTagPickerDraft])];
    setSingleTagSubmitting(true);
    const serialized = stringifyTagCodes(merged);
    const { error: updateError } = await supabase.from('scorms_master').update({ scorm_etiquetas: serialized }).eq('id', coursesModalRow.id);
    setSingleTagSubmitting(false);
    if (updateError) {
      setError(`No se pudo actualizar etiquetas del SCORM: ${updateError.message}`);
      return;
    }
    setRows((previousRows) => previousRows.map((row) => (row.id === coursesModalRow.id ? { ...row, scorm_etiquetas: serialized } : row)));
    setCoursesModalRow((previous) => (previous ? { ...previous, scorm_etiquetas: serialized } : previous));
    setSingleTagPickerDraft([]);
    setSingleTagPickerOpen(false);
    setStatusMessage('Etiquetas actualizadas correctamente.');
  };

  const applySuggestedTags = () => {
    setSingleTagPickerOpen(true);
    setSingleTagPickerDraft((previous) => [...new Set([...previous, ...suggestedTagDraft])]);
    setSuggestedTagsModalOpen(false);
  };

  const togglePublishSelection = (rowId) => {
    setSelectedPublishIds((previous) =>
      previous.includes(rowId) ? previous.filter((id) => id !== rowId) : [...previous, rowId]
    );
  };

  const toggleValidationSelection = (rowId) => {
    setSelectedValidationIds((previous) =>
      previous.includes(rowId) ? previous.filter((id) => id !== rowId) : [...previous, rowId]
    );
  };

  const toggleAllPendingPublishRows = () => {
    const pendingIds = publicationRows.map((row) => row.id);
    const areAllSelected = pendingIds.length > 0 && pendingIds.every((id) => selectedPublishIds.includes(id));

    if (areAllSelected) {
      setSelectedPublishIds((previous) => previous.filter((id) => !pendingIds.includes(id)));
      return;
    }

    setSelectedPublishIds((previous) => [...new Set([...previous, ...pendingIds])]);
  };

  const toggleAllPendingValidationRows = () => {
    const pendingIds = pendingValidationRows.map((row) => row.id);
    const areAllSelected = pendingIds.length > 0 && pendingIds.every((id) => selectedValidationIds.includes(id));

    if (areAllSelected) {
      setSelectedValidationIds((previous) => previous.filter((id) => !pendingIds.includes(id)));
      return;
    }

    setSelectedValidationIds((previous) => [...new Set([...previous, ...pendingIds])]);
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

    if (nextState === 'Pendiente de publicar' && !canMoveToPendingPublish) {
      setStatusMessage('');
      setError('Solo los usuarios validador pueden pasar SCORMs a "Pendiente de publicar".');
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


  const captureAlertSnapshot = (targetRows) => {
    return targetRows.reduce((acc, row) => {
      if (!row?.id) {
        return acc;
      }

      acc[row.id] = {
        scorms_alerta: getAlertDateValue(row),
        scorm_estado: getRowState(row),
      };

      return acc;
    }, {});
  };

  const applyAlertSnapshotToRows = (snapshot) => {
    const targetIds = Object.keys(snapshot).map((value) => Number(value));
    if (targetIds.length === 0) {
      return;
    }

    const patchRow = (row) => {
      const patch = snapshot[row.id];
      if (!patch) {
        return row;
      }

      return {
        ...row,
        scorms_alerta: patch.scorms_alerta,
        scorm_estado: patch.scorm_estado,
      };
    };

    setRows((previousRows) => previousRows.map((row) => patchRow(row)));
    setDetailDraft((previous) => (previous && targetIds.includes(previous.id) ? patchRow(previous) : previous));
    setActiveRow((previous) => (previous && targetIds.includes(previous.id) ? patchRow(previous) : previous));
  };

  const persistAlertSnapshot = async (snapshot) => {
    const updates = Object.entries(snapshot).map(([rowId, values]) =>
      supabase
        .from('scorms_master')
        .update({
          scorms_alerta: values.scorms_alerta,
          scorm_estado: values.scorm_estado,
        })
        .eq('id', Number(rowId))
    );

    const results = await Promise.all(updates);
    const failedUpdate = results.find((result) => result.error);

    if (failedUpdate?.error) {
      return { ok: false, message: failedUpdate.error.message };
    }

    return { ok: true };
  };

  const applyAlertActionHistory = async (action, direction = 'undo') => {
    const targetSnapshot = direction === 'undo' ? action.before : action.after;
    const persistResult = await persistAlertSnapshot(targetSnapshot);

    if (!persistResult.ok) {
      setError(`${direction === 'undo' ? 'No se pudo deshacer' : 'No se pudo rehacer'} la acción de alertas: ${persistResult.message}`);
      return false;
    }

    applyAlertSnapshotToRows(targetSnapshot);
    return true;
  };

  const handleUndoAlertAction = async () => {
    const lastAction = alertActionsHistory[alertActionsHistory.length - 1];

    if (!lastAction) {
      return;
    }

    setError('');
    setStatusMessage('');

    const ok = await applyAlertActionHistory(lastAction, 'undo');
    if (!ok) {
      return;
    }

    setAlertActionsHistory((previous) => previous.slice(0, -1));
    setAlertRedoHistory((previous) => [...previous, lastAction]);
    setStatusMessage('Acción de alertas deshecha correctamente.');
  };

  const handleRedoAlertAction = async () => {
    const actionToRestore = alertRedoHistory[alertRedoHistory.length - 1];

    if (!actionToRestore) {
      return;
    }

    setError('');
    setStatusMessage('');

    const ok = await applyAlertActionHistory(actionToRestore, 'redo');
    if (!ok) {
      return;
    }

    setAlertRedoHistory((previous) => previous.slice(0, -1));
    setAlertActionsHistory((previous) => [...previous, actionToRestore]);
    setStatusMessage('Acción de alertas rehecha correctamente.');
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


  const closeAlertGeneratorModal = () => {
    if (alertSubmitting) {
      return;
    }

    setAlertGeneratorModalOpen(false);
    setAlertCodesDraft('');
    setAlertNovedadDraft('');
    setAlertUrlDraft('');
  };

  const submitGenerateAlerts = async () => {
    if (!canGenerateAlerts) {
      setError('Tu usuario no tiene permisos para generar alertas.');
      return;
    }

    const tagCodes = parseTagCodesFromInput(alertCodesDraft);

    if (tagCodes.length === 0) {
      setError('Pega uno o varios códigos de etiqueta para generar alertas.');
      return;
    }

    setAlertSubmitting(true);
    setError('');
    setStatusMessage('');

    const { data: etiquetasData, error: etiquetasError } = await supabase
      .from('scorms_etiquetas')
      .select('etiqueta_codigo, clasificacion_scorm')
      .in('etiqueta_codigo', tagCodes);

    if (etiquetasError) {
      setAlertSubmitting(false);
      setError(`No se pudieron consultar las etiquetas: ${etiquetasError.message}`);
      return;
    }

    const classifications = [...new Set((etiquetasData || []).map((item) => String(item.clasificacion_scorm || '').trim()).filter(Boolean))];

    if (classifications.length === 0) {
      setAlertSubmitting(false);
      setError('No se encontró clasificación SCORM asociada a los códigos informados.');
      return;
    }

    const rowsToAlert = rows.filter((row) => classifications.includes(String(row.scorm_categoria || '').trim()));

    if (rowsToAlert.length === 0) {
      setAlertSubmitting(false);
      setStatusMessage('No hay SCORMs con la clasificación de las etiquetas informadas.');
      return;
    }

    const nowIso = new Date().toISOString();
    const etiquetasRaw = tagCodes.join(',');
    const novedad = String(alertNovedadDraft || '').trim();
    const novedadUrl = String(alertUrlDraft || '').trim();
    const scormCodes = [...new Set(rowsToAlert.map((row) => String(row.scorm_code || '').trim().toUpperCase()).filter(Boolean))];
    const payload = scormCodes.map((scormCode) => ({
        scorm_codigo: scormCode,
        alerta_fecha: nowIso,
        alerta_novedad: novedad || null,
        url_novedad: novedadUrl || null,
        alerta_etiquetas: etiquetasRaw,
      }));

    const { error: insertError } = await supabase.from('scorms_alertas').insert(payload);

    if (insertError) {
      setAlertSubmitting(false);
      setError(`No se pudieron generar las alertas: ${insertError.message}`);
      return;
    }

    setAlertSubmitting(false);
    setAlertGeneratorModalOpen(false);
    setAlertCodesDraft('');
    setAlertNovedadDraft('');
    setAlertUrlDraft('');
    setStatusMessage(`${payload.length} alerta(s) generada(s). Recargando vista de alertas...`);

    globalThis.setTimeout(() => {
      fetchData();
    }, 2000);
  };

  const dismissScormAlerts = async (scormCode) => {
    const normalizedCode = String(scormCode || '').trim().toUpperCase();

    if (!normalizedCode) {
      return;
    }

    setError('');
    setStatusMessage('');

    const { error: deleteError } = await supabase.from('scorms_alertas').delete().eq('scorm_codigo', normalizedCode);

    if (deleteError) {
      setError(`No se pudo descartar la alerta del SCORM ${normalizedCode}: ${deleteError.message}`);
      return;
    }

    setAlertRecords((previous) =>
      previous.filter((alertItem) => String(alertItem.scorm_codigo || '').trim().toUpperCase() !== normalizedCode),
    );
    setStatusMessage(`Alerta descartada para ${normalizedCode}.`);
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

    const shouldClearAlert = updateModalOptions.clearAlertOnSubmit === true;
    const beforeAlertSnapshot = shouldClearAlert ? captureAlertSnapshot(updateTargetRows) : null;

    const { error: stateError } = await supabase
      .from('scorms_master')
      .update({
        scorm_estado: 'Actualizado pendiente de publicar',
      })
      .in(
        'id',
        updateTargetRows.map((row) => row.id)
      );

    if (stateError) {
      setUpdateSubmitting(false);
      setError(`Se registró el cambio, pero no se pudo actualizar el estado: ${stateError.message}`);
      return;
    }

    if (shouldClearAlert) {
      const normalizedCodes = [...new Set(updateTargetRows.map((row) => String(row.scorm_code || '').trim().toUpperCase()).filter(Boolean))];

      if (normalizedCodes.length > 0) {
        const { error: deleteAlertError } = await supabase.from('scorms_alertas').delete().in('scorm_codigo', normalizedCodes);

        if (deleteAlertError) {
          setUpdateSubmitting(false);
          setError(
            `Se registró el cambio y el estado, pero no se pudo eliminar la alerta asociada en scorms_alertas: ${deleteAlertError.message}`,
          );
          return;
        }

        setAlertRecords((previous) =>
          previous.filter((alertItem) => !normalizedCodes.includes(String(alertItem.scorm_codigo || '').trim().toUpperCase())),
        );
      }
    }

    const nextSnapshot = updateTargetRows.reduce((acc, row) => {
      acc[row.id] = {
        scorms_alerta: getAlertDateValue(row),
        scorm_estado: 'Actualizado pendiente de publicar',
      };
      return acc;
    }, {});

    applyAlertSnapshotToRows(nextSnapshot);

    if (shouldClearAlert && beforeAlertSnapshot) {
      setAlertActionsHistory((previous) => [
        ...previous,
        {
          type: 'update_from_alerts',
          before: beforeAlertSnapshot,
          after: nextSnapshot,
        },
      ]);
      setAlertRedoHistory([]);
    }

    setUpdateTargetRow(null);
    setUpdateTargetRows([]);
    setUpdateModalOptions({ clearAlertOnSubmit: false, source: 'general' });
    setSelectedIds([]);
    setUpdateSubmitting(false);
    setStatusMessage(
      updateTargetRows.length === 1
        ? shouldClearAlert
          ? 'Actualización SCORM registrada, estado cambiado y alerta descartada.'
          : 'Actualización SCORM registrada y estado cambiado a "Actualizado pendiente de publicar".'
        : shouldClearAlert
          ? `${updateTargetRows.length} SCORMs actualizados, con estado cambiado y alerta descartada.`
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
        scorm_creador: defaultUpdateUser || null,
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
    const url = String(createDraft.scorm_url || '').trim();
    const test = String(createDraft.scorm_test || '').trim();

    if (!code || !name || !url || !test) {
      setError('Para crear el SCORM debes informar, como mínimo, Código, Nombre, URL y Test.');
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
    payload.scorm_creador = defaultUpdateUser || null;

    if (payload.scorm_estado === 'Publicado' && !canPublishAsAdmin) {
      setCreateSubmitting(false);
      setError('Solo los usuarios ADMIN pueden poner un SCORM en estado "Publicado".');
      return;
    }

    if (payload.scorm_estado === 'Pendiente de publicar' && !canMoveToPendingPublish) {
      setCreateSubmitting(false);
      setError('Solo los usuarios validador pueden crear SCORMs en estado "Pendiente de publicar".');
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

  const openExcelImport = () => {
    importFileInputRef.current?.click();
  };

  const closeImportPreviewModal = () => {
    if (importSubmitting) {
      return;
    }

    setImportPreviewModalOpen(false);
    setImportPreviewRows([]);
    setImportPreviewDuplicates([]);
    setImportPreviewRestrictedRows([]);
    setImportPreviewFileName('');
  };

  const handleExcelImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImportSubmitting(true);
    setError('');
    setStatusMessage('');

    try {
      const parsedRows = await parseScormExcelRows(file);

      if (parsedRows.length === 0) {
        setError('No se detectaron filas válidas en el fichero. Revisa cabeceras y datos mínimos (Código SCORM y Nombre del SCORM).');
        return;
      }

      const existingKeys = new Set(rows.map(getScormImportKey));
      const uniqueRows = [];
      const skippedDuplicates = [];
      const restrictedStateRows = [];

      parsedRows.forEach((row) => {
        const key = getScormImportKey(row);
        const normalizedState = String(row.scorm_estado || '').trim();
        const blockedByAdminState = normalizedState === 'Publicado' && !canPublishAsAdmin;
        const blockedByValidationState = normalizedState === 'Pendiente de publicar' && !canMoveToPendingPublish;

        if (blockedByAdminState || blockedByValidationState) {
          restrictedStateRows.push(`${row.scorm_idioma || 'SIN_IDIOMA'}-${row.scorm_code}`);
          return;
        }

        if (existingKeys.has(key)) {
          skippedDuplicates.push(`${row.scorm_idioma || 'SIN_IDIOMA'}-${row.scorm_code}`);
          return;
        }

        existingKeys.add(key);
        uniqueRows.push(row);
      });

      if (uniqueRows.length === 0) {
        setError('No hay nuevos SCORMs para importar. Todos están duplicados o tienen estados restringidos por permisos.');
        return;
      }

      setImportPreviewRows(uniqueRows);
      setImportPreviewDuplicates(skippedDuplicates);
      setImportPreviewRestrictedRows(restrictedStateRows);
      setImportPreviewFileName(file.name || 'fichero');
      setImportPreviewModalOpen(true);
    } catch (importException) {
      setError(`No se pudo leer el Excel: ${importException.message}`);
    } finally {
      event.target.value = '';
      setImportSubmitting(false);
    }
  };

  const confirmExcelImport = async () => {
    if (importPreviewRows.length === 0) {
      setError('No hay filas preparadas para importar.');
      return;
    }

    setImportSubmitting(true);
    setError('');
    setStatusMessage('');

    const rowsToImport = importPreviewRows.map((row) => ({
      ...row,
      scorm_creador: getCreatorUser(row) || defaultUpdateUser || null,
    }));

    const { data, error: importError } = await supabase.from('scorms_master').insert(rowsToImport).select('*');

    if (importError) {
      setImportSubmitting(false);
      setError(`No se pudo completar la importación: ${importError.message}`);
      return;
    }

    if (data?.length > 0) {
      setRows((previous) => [...previous, ...data]);
    }

    const summary = [`Importación completada: ${data?.length || 0} SCORM(s) creados.`];
    if (importPreviewDuplicates.length > 0) {
      summary.push(`${importPreviewDuplicates.length} duplicado(s) omitidos.`);
    }
    if (importPreviewRestrictedRows.length > 0) {
      summary.push(`${importPreviewRestrictedRows.length} fila(s) omitidas por estado restringido según permisos.`);
    }

    setStatusMessage(summary.join(' '));
    setImportSubmitting(false);
    closeImportPreviewModal();
  };

  const openRejectionModal = (rowsToReject) => {
    const normalizedRows = Array.isArray(rowsToReject) ? rowsToReject : [rowsToReject];
    const validRows = normalizedRows.filter(Boolean);

    if (validRows.length === 0) {
      return;
    }

    const forbiddenRow = validRows.find((row) => !canRejectScorm(row));
    if (forbiddenRow) {
      setStatusMessage('');
      setError(`No tienes permisos para rechazar el SCORM ${getInternationalizedCode(forbiddenRow)} en su estado actual.`);
      return;
    }

    setError('');
    setStatusMessage('');
    setRejectionTargetRows(validRows);
    setRejectionComment(validRows.length === 1 ? getRejectionComment(validRows[0]) : '');
  };

  const closeRejectionModal = () => {
    if (rejectionSubmitting) {
      return;
    }

    setRejectionTargetRows([]);
    setRejectionComment('');
  };

  const confirmRejectScorms = async () => {
    const normalizedComment = String(rejectionComment || '').trim();

    if (rejectionTargetRows.length === 0) {
      return;
    }

    if (!normalizedComment) {
      setError('Debes escribir un comentario para rechazar el SCORM.');
      setStatusMessage('');
      return;
    }

    const rejectedAt = new Date().toISOString();
    const rejectedBy = defaultUpdateUser || null;
    const previousStates = rejectionTargetRows.reduce((acc, row) => {
      acc[row.id] = getRowState(row);
      return acc;
    }, {});

    setRejectionSubmitting(true);
    setError('');
    setStatusMessage('');

    const updates = rejectionTargetRows.map((row) =>
      supabase
        .from('scorms_master')
        .update({
          scorm_estado: REJECTED_STATE,
          scorm_rechazo: normalizedComment,
          scorm_rechazo_comentario: normalizedComment,
          scorm_rechazo_user: rejectedBy,
          scorm_rechazo_fecha: rejectedAt,
          scorm_rechazo_estado_anterior: previousStates[row.id],
        })
        .eq('id', row.id)
    );

    const results = await Promise.all(updates);
    const failedUpdate = results.find((result) => result.error);

    if (failedUpdate?.error) {
      setRejectionSubmitting(false);
      setError(`No se pudo rechazar el SCORM: ${failedUpdate.error.message}`);
      return;
    }

    const rejectedIds = rejectionTargetRows.map((row) => row.id);
    const patchRejectedRow = (row) =>
      rejectedIds.includes(row.id)
        ? {
            ...row,
            scorm_estado: REJECTED_STATE,
            scorm_rechazo: normalizedComment,
            scorm_rechazo_comentario: normalizedComment,
            scorm_rechazo_user: rejectedBy,
            scorm_rechazo_fecha: rejectedAt,
            scorm_rechazo_estado_anterior: previousStates[row.id],
          }
        : row;

    setRows((previousRows) => previousRows.map((row) => patchRejectedRow(row)));
    setDetailDraft((previous) => (previous ? patchRejectedRow(previous) : previous));
    setActiveRow((previous) => (previous ? patchRejectedRow(previous) : previous));
    setMoveHistory((previous) => [
      ...previous,
      {
        rowIds: rejectedIds,
        fromStates: previousStates,
        toState: REJECTED_STATE,
      },
    ]);
    setRedoHistory([]);
    setSelectedPublishIds((previous) => previous.filter((id) => !rejectedIds.includes(id)));
    setSelectedValidationIds((previous) => previous.filter((id) => !rejectedIds.includes(id)));
    setRejectionSubmitting(false);
    setRejectionTargetRows([]);
    setRejectionComment('');
    setStatusMessage(
      rejectedIds.length === 1
        ? 'SCORM rechazado correctamente.'
        : `${rejectedIds.length} SCORMs rechazados correctamente.`
    );
  };

  const editRejectedComment = (row) => {
    if (!row?.id || getRowState(row) !== REJECTED_STATE) {
      return;
    }

    if (!canPublishAsAdmin && !rowHasResponsibleAgents(row, scopedResponsibleAgents)) {
      setStatusMessage('');
      setError('Solo puedes editar el motivo de rechazo de SCORMs asociados a tus agentes.');
      return;
    }

    setError('');
    setStatusMessage('');
    setRejectionTargetRows([row]);
    setRejectionComment(getRejectionComment(row));
  };

  const resendMyScorm = async (row, nextState) => {
    if (!row?.id || !MY_SCORMS_STATES.includes(nextState)) {
      return;
    }

    if (!canPublishAsAdmin && !rowHasResponsibleAgents(row, scopedResponsibleAgents)) {
      setStatusMessage('');
      setError('Solo puedes reenviar SCORMs asociados a tus agentes.');
      return;
    }

    const previousState = getRowState(row);
    setError('');
    setStatusMessage('');

    const { error: resendError } = await supabase
      .from('scorms_master')
      .update({
        scorm_estado: nextState,
        scorm_rechazo: null,
        scorm_rechazo_comentario: null,
        scorm_rechazo_user: null,
        scorm_rechazo_fecha: null,
        scorm_rechazo_estado_anterior: null,
      })
      .eq('id', row.id);

    if (resendError) {
      setError(`No se pudo reenviar el SCORM: ${resendError.message}`);
      return;
    }

    const patchRow = (currentRow) =>
      currentRow.id === row.id
        ? {
            ...currentRow,
            scorm_estado: nextState,
            scorm_rechazo: null,
            scorm_rechazo_comentario: null,
            scorm_rechazo_user: null,
            scorm_rechazo_fecha: null,
            scorm_rechazo_estado_anterior: null,
          }
        : currentRow;

    setRows((previousRows) => previousRows.map((currentRow) => patchRow(currentRow)));
    setDetailDraft((previous) => (previous ? patchRow(previous) : previous));
    setActiveRow((previous) => (previous ? patchRow(previous) : previous));
    setMoveHistory((previous) => [
      ...previous,
      {
        rowIds: [row.id],
        fromStates: { [row.id]: previousState },
        toState: nextState,
      },
    ]);
    setRedoHistory([]);
    setStatusMessage(`SCORM ${getInternationalizedCode(row)} reenviado a "${nextState}".`);
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

  const publishSelectedScorms = async () => {
    const selectedRows = publicationRows.filter((row) => selectedPublishIds.includes(row.id));

    if (selectedRows.length === 0) {
      setError('Selecciona uno o más SCORMs pendientes para publicar.');
      setStatusMessage('');
      return;
    }

    await updateRowsStatus(selectedRows.map((row) => row.id), 'Publicado');
    setSelectedPublishIds([]);
  };

  const moveSelectedScormsToPendingPublish = async () => {
    const selectedRows = pendingValidationRows.filter((row) => selectedValidationIds.includes(row.id));

    if (selectedRows.length === 0) {
      setError('Selecciona uno o más SCORMs pendientes de validación.');
      setStatusMessage('');
      return;
    }

    await updateRowsStatus(selectedRows.map((row) => row.id), 'Pendiente de publicar');
    setSelectedValidationIds([]);
  };

  const deleteScorm = async (row) => {
    if (!canDeleteAsAdmin) {
      setError('Solo los usuarios ADMIN pueden eliminar SCORMs.');
      setStatusMessage('');
      return;
    }

    if (!row?.id) {
      return;
    }

    const confirmation = globalThis?.confirm(`¿Eliminar el SCORM ${getInternationalizedCode(row)}? Esta acción no se puede deshacer.`);

    if (!confirmation) {
      return;
    }

    setError('');
    setStatusMessage('');

    const { error: deleteError } = await supabase.from('scorms_master').delete().eq('id', row.id);

    if (deleteError) {
      setError(`No se pudo eliminar el SCORM: ${deleteError.message}`);
      return;
    }

    setRows((previousRows) => previousRows.filter((currentRow) => currentRow.id !== row.id));
    setSelectedIds((previous) => previous.filter((id) => id !== row.id));
    setSelectedPublishIds((previous) => previous.filter((id) => id !== row.id));
    closeDetails();
    setStatusMessage(`SCORM ${getInternationalizedCode(row)} eliminado correctamente.`);
  };

  const togglePublishDateSort = () => {
    setPublishDateSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
  };

  const handleExportScormsGeneralExcel = () => {
    const exported = exportRowsToExcel({
      rows: filteredRows,
      preferredKeys: columns.map((column) => column.key),
      sheetName: 'scorms_general',
      fileName: `scorms_general_${new Date().toISOString().slice(0, 10)}.xls`,
    });

    if (!exported) {
      setStatusMessage('No hay SCORMs en la vista general para exportar.');
      return;
    }

    setStatusMessage(`Exportación Excel generada correctamente (${filteredRows.length} SCORMs).`);
  };

  const submitTagManager = async () => {
    const payload = {
      etiqueta_codigo: String(tagManagerDraft.etiqueta_codigo || '').trim().toUpperCase(),
      etiqueta_nombre: String(tagManagerDraft.etiqueta_nombre || '').trim(),
      clasificacion_scorm: String(tagManagerDraft.clasificacion_scorm || '').trim(),
    };
    if (!payload.etiqueta_codigo || !payload.etiqueta_nombre) {
      setError('Código y nombre de etiqueta son obligatorios.');
      return;
    }
    setTagManagerSubmitting(true);
    const { error: upsertError } = await supabase.from('scorms_etiquetas').upsert(payload, { onConflict: 'etiqueta_codigo' });
    setTagManagerSubmitting(false);
    if (upsertError) {
      setError(`No se pudo guardar la etiqueta: ${upsertError.message}`);
      return;
    }
    setTagManagerDraft({ etiqueta_codigo: '', etiqueta_nombre: '', clasificacion_scorm: '' });
    fetchData();
    setStatusMessage(`Etiqueta ${payload.etiqueta_codigo} guardada correctamente.`);
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
          {canAccessPublishView && (
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
          {canAccessValidationView && (
            <button
              type="button"
              className={`secondary ${hasItemsPendingValidation ? 'pending-highlight' : ''}`}
              onClick={() => setViewMode('validation')}
              disabled={viewMode === 'validation'}
            >
              Validación pendiente
              <span className="kpi-badge">{validationPendingCount}</span>
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
            className={`secondary ${alertScormsIndividualCount > 0 ? 'pending-highlight' : ''}`}
            onClick={() => setViewMode('alerts')}
            disabled={viewMode === 'alerts'}
            title='Ver alertas de actualización'
          >
            Alertas actualizaciones
            <span className="kpi-badge">{alertScormsIndividualCount}</span>
          </button>
          <button type="button" className="secondary" onClick={fetchData}>
            Recargar
          </button>
          {canPublishAsAdmin && (
            <button type="button" className="secondary" onClick={() => setTagManagerModalOpen(true)}>
              Gestor etiquetas
            </button>
          )}
          {viewMode === 'table' && (
            <button type="button" className="secondary" onClick={handleExportScormsGeneralExcel}>
              Exportar Excel
            </button>
          )}
          <button
            type="button"
            className={`secondary ${myScormRowsCount > 0 ? 'pending-highlight' : ''}`}
            onClick={() => setViewMode('mine')}
            disabled={!canUseMyScormsTray || viewMode === 'mine'}
            title={
              canUseMyScormsTray
                ? canPublishAsAdmin
                  ? 'Ver todas las validaciones de todos los usuarios'
                  : `Ver SCORMs asociados a tus responsables (${scopedResponsibleAgents.length})`
                : 'Tu usuario no tiene responsables asociados'
            }
          >
            {MY_SCORMS_VIEW_LABEL}
            <span className="kpi-badge">{myScormRowsCount}</span>
          </button>
        </div>
      </header>

      {myScormsOnly && scopedResponsibleAgents.length > 0 && (
        <p className="status">Filtro activo por responsables: {scopedResponsibleAgents.join(', ')}</p>
      )}

      {statusMessage && <p className="status ok">{statusMessage}</p>}
      {error && <p className="status error">{error}</p>}

      {loading && <p className="status">Cargando datos...</p>}

      {!loading && !canRenderTable && viewMode !== 'mine' && !error && (
        <p className="status">No hay registros que coincidan con los filtros actuales.</p>
      )}

      {!loading && (
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
              {activeFilterCount > 0 && <span className="filter-counter">{activeFilterCount}</span>}
            </div>
            <div className="filter-panel-title-actions">
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  className="secondary clear-all-filters"
                  onClick={(event) => {
                    event.stopPropagation();
                    clearAllFilters();
                  }}
                >
                  Limpiar filtros
                </button>
              ) : null}
              <span className="filter-collapse-label">{filtersCollapsed ? 'Expandir' : 'Colapsar'}</span>
            </div>
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
                        {usesSelect ? (
                          <div className="filter-lookup">
                            <button
                              type="button"
                              className="secondary filter-lookup-trigger"
                              onClick={() => openFilterLookup(column.key)}
                              aria-expanded={openFilterLookupKey === column.key}
                            >
                              <span aria-hidden="true">🔍</span> Seleccionar valores
                            </button>
                            {openFilterLookupKey === column.key ? (
                              <div className="filter-lookup-menu">
                                <div className="filter-lookup-search">
                                  <span aria-hidden="true">🔎</span>
                                  <input
                                    type="search"
                                    value={filterLookupSearchInputs[column.key] || ''}
                                    onChange={(event) => handleFilterLookupSearchChange(column.key, event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') {
                                        event.preventDefault();
                                        applyMatchingLookupFilter(column.key);
                                      }
                                    }}
                                    placeholder="Buscar valores..."
                                  />
                                </div>
                                <div className="filter-lookup-options">
                                  {(filterOptionsByColumn[column.key] || [])
                                    .filter((option) =>
                                      normalizeFilterLookupText(option).includes(normalizeFilterLookupText(filterLookupSearchInputs[column.key])),
                                    )
                                    .map((option) => {
                                      const optionSelected = (filterDraftSelections[column.key] || []).some(
                                        (value) => value.toLowerCase() === option.toLowerCase(),
                                      );

                                      return (
                                        <button
                                          key={`${column.key}-${option}`}
                                          type="button"
                                          className={`filter-lookup-option ${optionSelected ? 'is-selected' : ''}`}
                                          onClick={() => toggleDraftFilterSelection(column.key, option)}
                                          title={option}
                                        >
                                          <span>{option}</span>
                                        </button>
                                      );
                                    })}
                                  {(filterOptionsByColumn[column.key] || []).filter((option) =>
                                    normalizeFilterLookupText(option).includes(normalizeFilterLookupText(filterLookupSearchInputs[column.key])),
                                  ).length === 0 ? (
                                    <p className="filter-lookup-empty">Sin valores disponibles.</p>
                                  ) : null}
                                </div>
                                <div className="filter-lookup-actions">
                                  <button type="button" onClick={() => applyLookupFilter(column.key)}>
                                    Aplicar filtro
                                  </button>
                                  <button type="button" className="secondary" onClick={() => clearDraftLookupFilter(column.key)}>
                                    Limpiar
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="filter-controls">
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

                            <button type="button" className="secondary" onClick={() => addFieldFilter(column.key)}>
                              Añadir
                            </button>
                          </div>
                        )}

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

      {!loading && viewMode === 'mine' && (
        <section className="publish-view">
          <div className="publish-controls">
            <p className="status">
              {canPublishAsAdmin
                ? 'Vista ADMIN con todos los SCORMs pendientes de publicación, pendientes de validación y rechazados de todos los usuarios.'
                : 'Bandeja personal con SCORMs pendientes de publicación, pendientes de validación y rechazados asociados a tus agentes:'}
              {!canPublishAsAdmin && (
                <>
                  {' '}<strong>{scopedResponsibleAgents.join(', ') || 'sin agentes asociados'}</strong>.
                </>
              )}
            </p>
          </div>

          {myScormRows.length === 0 ? (
            <p className="status">No hay SCORMs en el flujo de validación/publicación para esta vista.</p>
          ) : (
            <div className="table-wrapper mine-table-wrapper">
              <table className="mine-scorms-table">
                <thead>
                  <tr>
                    {MY_VALIDATIONS_COLUMNS.map((column) => (
                      <th key={`mine-head-${column.key}`} className={`col-${column.key}`}>
                        {column.label}
                      </th>
                    ))}
                    <th>Comentario rechazo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {myScormRows.map((row) => {
                    const isRejected = getRowState(row) === REJECTED_STATE;
                    const hasRejectComment = getRejectionComment(row).length > 0;

                    return (
                      <tr key={`mine-row-${row.id}`} className={isRejected ? 'rejected-row' : ''}>
                        {MY_VALIDATIONS_COLUMNS.map((column) => (
                          <td key={`mine-${row.id}-${column.key}`} className={`col-${column.key}`}>
                            {column.key === '__creator__' ? (
                              <span>{getCreatorUser(row) || '-'}</span>
                            ) : column.key === 'publication_date' ? (
                              <span>{formatDateDDMMYYYY(getPublicationDateMs(row, latestUpdateByCode))}</span>
                            ) : column.key === 'publication_update_type' ? (
                              <span>{isRejected ? 'Rechazado' : getPublicationUpdateType(row, latestUpdateByCode)}</span>
                            ) : column.key === 'scorm_url' ? (
                              row[column.key] ? (
                                <a href={getExternalUrl(row[column.key])} target="_blank" rel="noreferrer" className="table-link">
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
                            ) : column.key === 'scorm_estado' && isRejected ? (
                              <span className="rejected-badge">Rechazado</span>
                            ) : (
                              <span>{row[column.key] || '-'}</span>
                            )}
                          </td>
                        ))}
                        <td>
                          {hasRejectComment ? (
                            <button type="button" className="secondary action-button comments-button" onClick={() => setCommentsModalRow(row)}>
                              COMENTARIOS
                            </button>
                          ) : (
                            <span className="muted">Sin comentarios</span>
                          )}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button type="button" className="secondary action-button" onClick={() => openDetails(row)}>
                              Detalles
                            </button>
                            {isRejected && (
                              <button type="button" className="secondary action-button comments-button" onClick={() => editRejectedComment(row)}>
                                Editar motivo
                              </button>
                            )}
                            <button
                              type="button"
                              className="secondary action-button"
                              onClick={() => resendMyScorm(row, VALIDATION_PENDING_STATE)}
                              disabled={getRowState(row) === VALIDATION_PENDING_STATE}
                            >
                              Enviar a validar
                            </button>
                            <button
                              type="button"
                              className="publish-button action-button"
                              onClick={() => resendMyScorm(row, 'Pendiente de publicar')}
                              disabled={getRowState(row) === 'Pendiente de publicar'}
                            >
                              Enviar a publicar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {!loading && canRenderTable && viewMode === 'table' && (
        <div className="table-wrapper">
          <div className="table-top-controls">
            <div className="header-actions table-actions">
              <button type="button" onClick={openCreateModal}>
                Crear SCORM
              </button>
              <button type="button" className="secondary" onClick={openExcelImport} disabled={importSubmitting}>
                {importSubmitting ? 'Importando Excel...' : 'Importar SCORMs (Excel)'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => openUpdateModal(rows.filter((row) => selectedIds.includes(row.id)))}
                disabled={selectedIds.length === 0}
              >
                Actualizar selección ({selectedIds.length})
              </button>
              <button type="button" className="secondary" onClick={openBulkEditModal} disabled={!canPublishAsAdmin || selectedIds.length < 2}>
                Editar Selección ({selectedIds.length})
              </button>
              <button type="button" className="secondary" disabled={moveHistory.length === 0} onClick={handleUndo}>
                ← DESHACER
              </button>
              <button type="button" className="secondary" disabled={redoHistory.length === 0} onClick={handleRedo}>
                REHACER →
              </button>
            </div>

            <input
              ref={importFileInputRef}
              type="file"
              accept=".xlsx,.xls,.xml,.csv,.tsv,.txt"
              style={{ display: 'none' }}
              onChange={handleExcelImport}
            />

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
                <tr key={row.id} onDoubleClick={() => openDetails(row)}>
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
                              href={getExternalUrl(row[column.key])}
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
                            • Etiquetas ({getTagRowsForScorm(row).length})
                          </button>
                        ) : column.key === 'scorm_test' ? (
                          <span className={`test-indicator ${scormTestDisplay.isPositive ? 'ok' : 'error'}`}>
                            {scormTestDisplay.value} {!scormTestDisplay.isPositive ? '❌' : ''}{' '}
                            <button
                              type="button"
                              className="txt-icon-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openTestQuestionsModal(row);
                              }}
                              title="Editar preguntas tipo test"
                              aria-label={`Editar preguntas tipo test de ${getOfficialName(row)}`}
                            >
                              📄 Test
                            </button>
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
            <button type="button" onClick={publishSelectedScorms} disabled={selectedPublishIds.length === 0}>
              Publicar selección ({selectedPublishIds.length})
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
                              <a href={getExternalUrl(row.scorm_url)} target="_blank" rel="noreferrer" className="table-link">
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
              <button
                type="button"
                className="secondary"
                disabled={translationPreset === 'todos' && selectedTranslationGroupIds.length === 0}
                onClick={() => {
                  setTranslationPreset('todos');
                  setPendingLanguage('ES');
                  setSelectedTranslationGroupIds([]);
                }}
              >
                Limpiar filtros de traducción
              </button>
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

      {!loading && canAccessPublishView && viewMode === 'publish' && (
        <section className="publish-view">
          {!canPublishAsAdmin ? (
            <p className="status">Puedes ver esta bandeja, pero solo ADMIN puede cambiar el estado a "Publicado".</p>
          ) : null}
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
            <button
              type="button"
              className="secondary"
              disabled={publishPreset === 'todos'}
              onClick={() => setPublishPreset('todos')}
            >
              Limpiar filtros de publicación
            </button>
          </div>

          <div className="status-board-actions">
            <button type="button" className="secondary" disabled={moveHistory.length === 0} onClick={handleUndo}>
              ← DESHACER
            </button>
            <button type="button" className="secondary" disabled={redoHistory.length === 0} onClick={handleRedo}>
              REHACER →
            </button>
            <button type="button" onClick={publishSelectedScorms} disabled={!canPublishAsAdmin || selectedPublishIds.length === 0}>
              Publicar selección ({selectedPublishIds.length})
            </button>
          </div>

          {publicationRows.length === 0 ? (
            <p className="status">No hay SCORMs para publicar con el filtro seleccionado.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th className="col-selector">
                      <input
                        type="checkbox"
                        checked={publicationRows.length > 0 && publicationRows.every((row) => selectedPublishIds.includes(row.id))}
                        onChange={toggleAllPendingPublishRows}
                        disabled={!canPublishAsAdmin}
                        aria-label="Seleccionar todos los SCORMs pendientes de publicación"
                      />
                    </th>
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
                      <td className="col-selector">
                        <input
                          type="checkbox"
                          checked={selectedPublishIds.includes(row.id)}
                          onChange={() => togglePublishSelection(row.id)}
                          disabled={!canPublishAsAdmin}
                          aria-label={`Seleccionar ${getInternationalizedCode(row)} para publicación`}
                        />
                      </td>
                      {publishColumns.map((column) => (
                        <td key={`publish-${row.id}-${column.key}`} className={`col-${column.key}`}>
                          {column.key === 'publication_date' ? (
                            <span>{formatDateDDMMYYYY(getPublicationDateMs(row, latestUpdateByCode))}</span>
                          ) : column.key === 'publication_update_type' ? (
                            <span>{getPublicationUpdateType(row, latestUpdateByCode)}</span>
                          ) : column.key === 'scorm_url' ? (
                            row[column.key] ? (
                              <a href={getExternalUrl(row[column.key])} target="_blank" rel="noreferrer" className="table-link">
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
                          <button
                            type="button"
                            className="publish-button action-button"
                            onClick={() => publishScorm(row)}
                            disabled={!canPublishAsAdmin}
                          >
                            PUBLICAR SCORM
                          </button>
                          <button
                            type="button"
                            className="secondary action-button reject-button"
                            onClick={() => openRejectionModal(row)}
                            disabled={!canRejectScorm(row)}
                          >
                            RECHAZAR
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


      {!loading && canAccessValidationView && viewMode === 'validation' && (
        <section className="publish-view">
          <div className="status-board-actions">
            <button type="button" className="secondary" disabled={moveHistory.length === 0} onClick={handleUndo}>
              ← DESHACER
            </button>
            <button type="button" className="secondary" disabled={redoHistory.length === 0} onClick={handleRedo}>
              REHACER →
            </button>
            <button
              type="button"
              onClick={moveSelectedScormsToPendingPublish}
              disabled={selectedValidationIds.length === 0 || !canMoveToPendingPublish}
              title={canMoveToPendingPublish ? 'Mover selección a pendiente de publicar' : 'Solo usuarios validador'}
            >
              Validar selección ({selectedValidationIds.length})
            </button>
          </div>

          {!canMoveToPendingPublish ? (
            <p className="status">Solo los usuarios con <strong>validador: true</strong> pueden mover SCORMs a "Pendiente de publicar".</p>
          ) : null}

          {pendingValidationRows.length === 0 ? (
            <p className="status">No hay SCORMs en estado "Pendiente de validación" para los filtros actuales.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th className="col-selector">
                      <input
                        type="checkbox"
                        checked={pendingValidationRows.length > 0 && pendingValidationRows.every((row) => selectedValidationIds.includes(row.id))}
                        onChange={toggleAllPendingValidationRows}
                        aria-label="Seleccionar todos los SCORMs pendientes de validación"
                      />
                    </th>
                    {publishColumns.map((column) => (
                      <th key={`validation-head-${column.key}`} className={`col-${column.key}`}>
                        {column.label}
                      </th>
                    ))}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingValidationRows.map((row) => (
                    <tr key={`validation-row-${row.id}`}>
                      <td className="col-selector">
                        <input
                          type="checkbox"
                          checked={selectedValidationIds.includes(row.id)}
                          onChange={() => toggleValidationSelection(row.id)}
                          aria-label={`Seleccionar ${getInternationalizedCode(row)} para validación`}
                        />
                      </td>
                      {publishColumns.map((column) => (
                        <td key={`validation-${row.id}-${column.key}`} className={`col-${column.key}`}>
                          {column.key === 'publication_date' ? (
                            <span>{formatDateDDMMYYYY(getRowDateMs(row))}</span>
                          ) : column.key === 'publication_update_type' ? (
                            <span>Pendiente de validación</span>
                          ) : column.key === 'scorm_url' ? (
                            row[column.key] ? (
                              <a href={getExternalUrl(row[column.key])} target="_blank" rel="noreferrer" className="table-link">
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
                          <button
                            type="button"
                            className="publish-button action-button"
                            disabled={!canMoveToPendingPublish}
                            onClick={() => updateRowsStatus([row.id], 'Pendiente de publicar')}
                          >
                            VALIDAR SCORM
                          </button>
                          <button
                            type="button"
                            className="secondary action-button reject-button"
                            onClick={() => openRejectionModal(row)}
                            disabled={!canRejectScorm(row)}
                          >
                            RECHAZAR
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
          <div className="publish-controls">
            {canGenerateAlerts && (
              <button type="button" onClick={() => setAlertGeneratorModalOpen(true)} disabled={alertSubmitting}>
                Generar alertas
              </button>
            )}
          </div>
          {alertsByScormCode.length === 0 ? (
            <p className="status">No hay SCORMs con alertas registradas.</p>
          ) : (
            <div className="scorms-accordion-list">
              {alertsByScormCode.map((scormAlertGroup) => (
                <details key={`alerts-group-${scormAlertGroup.scormCode}`} className="scorms-accordion-item course-level-1">
                  <summary>
                    <div className="course-summary-grid scorm-alert-summary-grid">
                      <strong>{scormAlertGroup.scormCode}</strong>
                      <span>{scormAlertGroup.scormName}</span>
                      <span>
                        Clasificación:{' '}
                        <span className="category-chip" style={getCategoryColor(scormAlertGroup.scormClassification)}>
                          {scormAlertGroup.scormClassification || 'Sin clasificación'}
                        </span>
                      </span>
                      <span>
                        Última alerta: {formatDateDDMMYYYY(scormAlertGroup.lastAlertDate)} ({scormAlertGroup.alertCount})
                      </span>
                      <span className="row-actions" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="secondary action-button"
                          onClick={() => dismissScormAlerts(scormAlertGroup.scormCode)}
                        >
                          DESCARTAR ALERTA
                        </button>
                        <button
                          type="button"
                          className="secondary action-button"
                          onClick={() => openUpdateModal(scormAlertGroup.relatedRows, { clearAlertOnSubmit: true, source: 'alerts' })}
                        >
                          ACTUALIZAR SCORM
                        </button>
                      </span>
                    </div>
                  </summary>

                  <div className="table-wrapper details-table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha alerta</th>
                          <th>Novedad</th>
                          <th>URL novedad</th>
                          <th>Etiquetas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scormAlertGroup.alerts.map((alertItem) => {
                          const alertItemKey = `alert-item-${alertItem.id}`;
                          const currentTagCodes = parseTagCodesFromInput(alertItem.alerta_etiquetas || '');
                          const isTagsOpen = expandedAlertTags[alertItemKey] === true;
                          const relatedTags = currentTagCodes.flatMap((tagCode) => tagsByCode[tagCode] || []);

                          return (
                            <tr key={alertItemKey}>
                              <td>{formatDateDDMMYYYY(alertItem.alerta_fecha || alertItem.created_at)}</td>
                              <td>{String(alertItem.alerta_novedad || '').trim() || '-'}</td>
                              <td>
                                {String(alertItem.url_novedad || '').trim() ? (
                                  <a href={getExternalUrl(alertItem.url_novedad)} target="_blank" rel="noopener noreferrer">
                                    {String(alertItem.url_novedad || '').trim()}
                                  </a>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="secondary action-button"
                                  onClick={() =>
                                    setExpandedAlertTags((previous) => ({
                                      ...previous,
                                      [alertItemKey]: !isTagsOpen,
                                    }))
                                  }
                                >
                                  {isTagsOpen ? 'Ocultar etiquetas' : 'Ver etiquetas'}
                                </button>
                                {isTagsOpen && (
                                  <div className="table-wrapper" style={{ marginTop: '0.6rem' }}>
                                    <table>
                                      <thead>
                                        <tr>
                                          <th>Código</th>
                                          <th>Nombre</th>
                                          <th>Clasificación</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {relatedTags.length === 0 ? (
                                          <tr>
                                            <td colSpan={3}>No se encontraron etiquetas para esta alerta.</td>
                                          </tr>
                                        ) : (
                                          relatedTags.map((tag, index) => (
                                            <tr key={`${alertItemKey}-${tag.etiqueta_codigo}-${index}`}>
                                              <td>{tag.etiqueta_codigo || '-'}</td>
                                              <td>{tag.etiqueta_nombre || '-'}</td>
                                              <td>{tag.clasificacion_scorm || '-'}</td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      )}

      {alertGeneratorModalOpen && (
        <div className="modal-overlay" role="presentation">
          <div
            className="modal-content modal-content-narrow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="generar-alertas-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <h3 id="generar-alertas-titulo">Generar alertas</h3>
                <p>Pega códigos de etiqueta (separados por espacios, comas o salto de línea).</p>
              </div>
              <button type="button" className="secondary" onClick={closeAlertGeneratorModal} disabled={alertSubmitting}>
                Cerrar
              </button>
            </header>

            <label>
              <span>Códigos de etiqueta</span>
              <textarea
                rows={8}
                value={alertCodesDraft}
                onChange={(event) => setAlertCodesDraft(event.target.value)}
                placeholder="Ejemplo: ETQ001, ETQ002"
                disabled={alertSubmitting}
              />
            </label>

            <label>
              <span>Novedad</span>
              <textarea
                rows={4}
                value={alertNovedadDraft}
                onChange={(event) => setAlertNovedadDraft(event.target.value)}
                placeholder="Describe la novedad asociada a la alerta"
                disabled={alertSubmitting}
              />
            </label>

            <label>
              <span>URL novedad</span>
              <input
                type="url"
                value={alertUrlDraft}
                onChange={(event) => setAlertUrlDraft(event.target.value)}
                placeholder="https://..."
                disabled={alertSubmitting}
              />
            </label>

            <footer className="modal-footer">
              <button type="button" className="secondary" onClick={closeAlertGeneratorModal} disabled={alertSubmitting}>
                Cancelar
              </button>
              <button type="button" onClick={submitGenerateAlerts} disabled={alertSubmitting || !canGenerateAlerts}>
                {alertSubmitting ? 'Generando...' : 'Confirmar: generar alertas'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {translationModalOpen && (
        <div className="modal-overlay" role="presentation">
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


      {importPreviewModalOpen && (
        <div className="modal-overlay" role="presentation">
          <div
            className="modal-content modal-content-large"
            role="dialog"
            aria-modal="true"
            aria-labelledby="importar-excel-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <h3 id="importar-excel-titulo">Confirmar importación de SCORMs</h3>
                <p>
                  Archivo: <strong>{importPreviewFileName}</strong> · {importPreviewRows.length} fila(s) lista(s) para importar
                </p>
              </div>
              <button type="button" className="secondary" onClick={closeImportPreviewModal} disabled={importSubmitting}>
                Cerrar
              </button>
            </header>

            <div className="status-banner-group">
              {importPreviewDuplicates.length > 0 && (
                <p className="status">{importPreviewDuplicates.length} duplicado(s) detectado(s), no se importarán.</p>
              )}
              {importPreviewRestrictedRows.length > 0 && (
                <p className="status">{importPreviewRestrictedRows.length} fila(s) con estado restringido por permisos, no se importarán.</p>
              )}
            </div>

            <div className="table-wrapper details-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Idioma</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Responsable</th>
                    <th>Categoría</th>
                    <th>Subcategoría</th>
                    <th>Estado</th>
                    <th>Test</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreviewRows.map((row, index) => (
                    <tr key={`import-preview-${row.scorm_idioma || 'SIN_IDIOMA'}-${row.scorm_code}-${index}`}>
                      <td>{row.scorm_idioma || '-'}</td>
                      <td>{row.scorm_code || '-'}</td>
                      <td>{row.scorm_name || '-'}</td>
                      <td>{row.scorm_tipo || '-'}</td>
                      <td>{row.scorm_responsable || '-'}</td>
                      <td>{row.scorm_categoria || '-'}</td>
                      <td>{row.scorm_subcategoria || '-'}</td>
                      <td>{row.scorm_estado || '-'}</td>
                      <td>{row.scorm_test || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="modal-footer">
              <button type="button" className="secondary" onClick={closeImportPreviewModal} disabled={importSubmitting}>
                Cancelar
              </button>
              <button type="button" onClick={confirmExcelImport} disabled={importSubmitting || importPreviewRows.length === 0}>
                {importSubmitting ? 'Importando...' : 'Confirmar importación'}
              </button>
            </footer>
          </div>
        </div>
      )}


      {activeRow && detailDraft && (
        <div className="modal-overlay" role="presentation">
          <div
            className="modal-content detail-modal-content"
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

            <div className="details-modal-layout">
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
                          {column.key === 'scorm_observaciones' ? (
                            <textarea
                              className="field-observaciones-textarea"
                              value={detailDraft[column.key] || ''}
                              onChange={(event) => updateDetailDraft(column.key, event.target.value)}
                            />
                          ) : SCORM_SELECTOR_FIELDS.includes(column.key) ? (
                            <select
                              value={detailDraft[column.key] || ''}
                              onChange={(event) => handleSelectorFieldChange('detail', column.key, event.target.value)}
                            >
                              <option value="">Selecciona una opción</option>
                              {(selectorOptionsByField[column.key] || []).map((optionValue) => (
                                <option key={`detail-${column.key}-${optionValue}`} value={optionValue}>
                                  {optionValue}
                                </option>
                              ))}
                              {canAddNewSelectorValue(column.key) ? (
                                <option value={NEW_SELECTOR_OPTION_VALUE}>+ Añadir {column.label.toLowerCase()}…</option>
                              ) : null}
                            </select>
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

              <aside className="detail-update-notes-panel" aria-live="polite">
                <div className="detail-update-notes-card">
                  <span className="detail-update-notes-eyebrow">Última actualización registrada</span>
                  <h4>Notas de la actualización</h4>
                  {detailLatestUpdateLoading ? (
                    <p className="status">Cargando notas…</p>
                  ) : (
                    <>
                      <textarea
                        className="detail-update-notes-text detail-update-notes-textarea"
                        value={detailLatestUpdateDraft}
                        onChange={(event) => setDetailLatestUpdateDraft(event.target.value)}
                        placeholder="Añade notas sobre la última actualización registrada"
                      />
                      {!detailLatestUpdate ? (
                        <p className="detail-update-notes-empty">Todavía no existe registro en <code>scorms_actualizacion</code>; al guardar se creará uno con estas notas.</p>
                      ) : null}
                    </>
                  )}

                  <dl className="detail-update-notes-meta">
                    <div>
                      <dt>Tipo</dt>
                      <dd>{detailLatestUpdate?.cambio_tipo || '-'}</dd>
                    </div>
                    <div>
                      <dt>Fecha</dt>
                      <dd>
                        {detailLatestUpdate?.fecha_modif
                          ? new Date(detailLatestUpdate.fecha_modif).toLocaleDateString('es-ES')
                          : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt>Usuario</dt>
                      <dd>{detailLatestUpdate?.cambio_user || '-'}</dd>
                    </div>
                  </dl>
                </div>
              </aside>
            </div>

            <footer className="modal-footer">
              <button type="button" className="secondary action-button" onClick={() => openTestQuestionsModal(detailDraft)}>
                📄 Test
              </button>
              <button type="button" className="secondary action-button" onClick={openHistoryModal}>
                Actualizaciones
              </button>
              <button type="button" className="secondary action-button" onClick={() => openUpdateModal(detailDraft)}>
                Actualizar SCORM
              </button>
              {canDeleteAsAdmin ? (
                <button type="button" className="secondary action-button delete-button" onClick={() => deleteScorm(detailDraft)}>
                  Eliminar SCORM
                </button>
              ) : null}
              <button type="button" onClick={saveDetails}>
                Guardar detalles
              </button>
            </footer>
          </div>
        </div>
      )}

      {testQuestionsModalRow && (
        <div className="modal-overlay" role="presentation">
          <div
            className="modal-content modal-content-narrow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preguntas-test-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <h3 id="preguntas-test-titulo">Preguntas tipo test</h3>
                <p>{getOfficialName(testQuestionsModalRow)} · {getInternationalizedCode(testQuestionsModalRow)}</p>
              </div>
              <button type="button" className="secondary" onClick={closeTestQuestionsModal} disabled={testQuestionsSubmitting}>
                Cerrar
              </button>
            </header>

            <label className="details-grid-single">
              <span>Texto preguntas test</span>
              <textarea
                className="field-observaciones-textarea"
                placeholder="Escribe aquí las preguntas tipo test. Se mantendrán los saltos de línea."
                value={testQuestionsDraft}
                onChange={(event) => setTestQuestionsDraft(event.target.value)}
              />
            </label>

            <footer className="modal-footer">
              <button type="button" className="secondary" onClick={closeTestQuestionsModal} disabled={testQuestionsSubmitting}>
                Cancelar
              </button>
              <button type="button" onClick={saveTestQuestions} disabled={testQuestionsSubmitting}>
                {testQuestionsSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {historyModalOpen && detailDraft && (
        <div className="modal-overlay" role="presentation">
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
        <div className="modal-overlay" role="presentation">
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
                <span>Usuario</span>
                <input
                  type="text"
                  value={updateForm.cambio_user}
                  placeholder={defaultUpdateUser || 'Indicar manualmente'}
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

      {bulkEditModalOpen && (
        <div className="modal-overlay" role="presentation">
          <div className="modal-content modal-content-narrow" role="dialog" aria-modal="true" aria-labelledby="edicion-masiva-scorm-title">
            <header className="modal-header">
              <div>
                <h3 id="edicion-masiva-scorm-title">Editar selección de SCORMs</h3>
                <p>{selectedIds.length} SCORM(s) seleccionados</p>
              </div>
              <button type="button" className="secondary" onClick={closeBulkEditModal} disabled={bulkEditSubmitting}>
                Cerrar
              </button>
            </header>
            <div className="details-grid details-grid-single">
              {SCORM_SELECTOR_FIELDS.filter((fieldKey) => ['scorm_responsable', 'scorm_tipo', 'scorm_categoria', 'scorm_subcategoria', 'scorm_test'].includes(fieldKey)).map((fieldKey) => {
                const column = columns.find((item) => item.key === fieldKey);
                return (
                  <label key={`bulk-${fieldKey}`}>
                    <span>{column?.label || fieldKey}</span>
                    <select
                      value={bulkEditDraft[fieldKey] || ''}
                      onChange={(event) => setBulkEditDraft((previous) => ({ ...previous, [fieldKey]: event.target.value }))}
                    >
                      <option value="">No modificar</option>
                      {(selectorOptionsByField[fieldKey] || []).map((optionValue) => (
                        <option key={`bulk-${fieldKey}-${optionValue}`} value={optionValue}>
                          {optionValue}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
            <div className="modal-footer" style={{ justifyContent: 'flex-start' }}>
              <button type="button" className="secondary" onClick={() => setBulkTagPickerOpen((prev) => !prev)}>
                + Añadir etiquetas masivamente
              </button>
            </div>
            {bulkTagPickerOpen && (
              <div className="filter-lookup-menu">
                {selectedBulkTagRows.length > 0 && (
                  <div className="filter-lookup-options">
                    {selectedBulkTagRows.map((tagRow) => {
                      const code = String(tagRow.etiqueta_codigo || '').trim().toUpperCase();
                      return (
                        <button
                          key={`bulk-selected-${code}`}
                          type="button"
                          className="filter-lookup-option is-selected"
                          onClick={() => toggleTagCodeInDraft(setBulkTagPickerDraft, code)}
                          title="Quitar etiqueta seleccionada"
                        >
                          {code} - {tagRow.etiqueta_nombre || 'Sin nombre'} · Quitar
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="filter-lookup-search">
                  <input
                    type="text"
                    value={bulkTagPickerSearch}
                    onChange={(event) => setBulkTagPickerSearch(event.target.value)}
                    placeholder="Buscar etiquetas..."
                  />
                </div>
                <div className="filter-lookup-options">
                  {bulkTagPickerRows.map((tagRow) => {
                    const code = String(tagRow.etiqueta_codigo || '').trim().toUpperCase();
                    const selected = bulkTagPickerDraft.includes(code);
                    return (
                      <button key={`bulk-tag-${code}`} type="button" className={`filter-lookup-option ${selected ? 'is-selected' : ''}`} onClick={() => toggleTagCodeInDraft(setBulkTagPickerDraft, code)}>
                        {code} - {tagRow.etiqueta_nombre || 'Sin nombre'}
                      </button>
                    );
                  })}
                </div>
                <div className="filter-lookup-actions">
                  <button type="button" onClick={applyBulkTags} disabled={bulkEditSubmitting || bulkTagPickerDraft.length === 0}>
                    Añadir seleccionadas ({bulkTagPickerDraft.length})
                  </button>
                </div>
              </div>
            )}
            <footer className="modal-footer">
              <button type="button" className="secondary" onClick={closeBulkEditModal} disabled={bulkEditSubmitting}>
                Cancelar
              </button>
              <button type="button" onClick={submitBulkEdit} disabled={bulkEditSubmitting}>
                {bulkEditSubmitting ? 'Guardando...' : 'Aplicar edición masiva'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {tagManagerModalOpen && (
        <div className="modal-overlay" role="presentation">
          <div className="modal-content modal-content-large" role="dialog" aria-modal="true">
            <header className="modal-header">
              <div>
                <h3>Gestor de etiquetas</h3>
                <p>Alta/edición rápida y filtrado tipo Qlik de etiquetas.</p>
              </div>
              <button type="button" className="secondary" onClick={() => setTagManagerModalOpen(false)}>Cerrar</button>
            </header>
            <div className="details-grid">
              <label><span>Buscar</span><input value={tagManagerSearch} onChange={(e) => setTagManagerSearch(e.target.value)} /></label>
              <label><span>Código</span><input value={tagManagerDraft.etiqueta_codigo} onChange={(e) => setTagManagerDraft((p) => ({ ...p, etiqueta_codigo: e.target.value }))} /></label>
              <label><span>Nombre</span><input value={tagManagerDraft.etiqueta_nombre} onChange={(e) => setTagManagerDraft((p) => ({ ...p, etiqueta_nombre: e.target.value }))} /></label>
              <label><span>Clasificación SCORM</span><input value={tagManagerDraft.clasificacion_scorm} onChange={(e) => setTagManagerDraft((p) => ({ ...p, clasificacion_scorm: e.target.value }))} /></label>
            </div>
            <div className="table-shell">
              <table>
                <thead><tr><th>Código</th><th>Nombre</th><th>Clasificación</th></tr></thead>
                <tbody>
                  {tagCatalogFilteredRows.map((tagRow) => (
                    <tr key={tagRow.etiqueta_codigo} onClick={() => setTagManagerDraft(tagRow)}>
                      <td>{tagRow.etiqueta_codigo}</td><td>{tagRow.etiqueta_nombre}</td><td>{tagRow.clasificacion_scorm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="modal-footer">
              <button type="button" onClick={submitTagManager} disabled={tagManagerSubmitting}>{tagManagerSubmitting ? 'Guardando...' : 'Guardar etiqueta'}</button>
            </footer>
          </div>
        </div>
      )}

      {createDraft && (
        <div className="modal-overlay" role="presentation">
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
                  <span>
                    {column.label}
                    {REQUIRED_CREATE_FIELDS.includes(column.key) ? ' (obligatorio)' : ''}
                  </span>
                  {SCORM_SELECTOR_FIELDS.includes(column.key) ? (
                    <select
                      value={createDraft[column.key] || ''}
                      onChange={(event) => handleSelectorFieldChange('create', column.key, event.target.value)}
                      required={REQUIRED_CREATE_FIELDS.includes(column.key)}
                    >
                      <option value="">Selecciona una opción</option>
                      {(selectorOptionsByField[column.key] || []).map((optionValue) => (
                        <option key={`create-${column.key}-${optionValue}`} value={optionValue}>
                          {optionValue}
                        </option>
                      ))}
                      {canAddNewSelectorValue(column.key) ? (
                        <option value={NEW_SELECTOR_OPTION_VALUE}>+ Añadir {column.label.toLowerCase()}…</option>
                      ) : null}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={createDraft[column.key] || ''}
                      onChange={(event) => updateCreateDraft(column.key, event.target.value)}
                      required={REQUIRED_CREATE_FIELDS.includes(column.key)}
                    />
                  )}
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

      {rejectionTargetRows.length > 0 && (
        <div className="modal-overlay" role="presentation">
          <div
            className="modal-content modal-content-narrow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rechazar-scorm-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <h3 id="rechazar-scorm-titulo">Rechazar SCORM</h3>
                <p>El comentario es obligatorio y quedará visible en {MY_SCORMS_VIEW_LABEL}.</p>
              </div>
              <button type="button" className="secondary" onClick={closeRejectionModal} disabled={rejectionSubmitting}>
                Cerrar
              </button>
            </header>

            <div className="details-grid details-grid-single">
              <p className="status">
                SCORM(s): {rejectionTargetRows.map((row) => getInternationalizedCode(row)).join(', ')}
              </p>
              <label>
                <span>Comentario de rechazo (obligatorio)</span>
                <textarea
                  value={rejectionComment}
                  placeholder="Describe qué debe corregirse antes de volver a enviar el SCORM."
                  onChange={(event) => setRejectionComment(event.target.value)}
                  required
                />
              </label>
            </div>

            <footer className="modal-footer">
              <button type="button" className="secondary" onClick={closeRejectionModal} disabled={rejectionSubmitting}>
                Cancelar
              </button>
              <button type="button" className="reject-confirm-button" onClick={confirmRejectScorms} disabled={rejectionSubmitting}>
                {rejectionSubmitting ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {commentsModalRow && (
        <div className="modal-overlay" role="presentation">
          <div
            className="modal-content modal-content-narrow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="comentarios-rechazo-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <h3 id="comentarios-rechazo-titulo">Comentarios del rechazo</h3>
                <p>{getOfficialName(commentsModalRow)} · {getInternationalizedCode(commentsModalRow)}</p>
              </div>
              <button type="button" className="secondary" onClick={() => setCommentsModalRow(null)}>
                Cerrar
              </button>
            </header>

            <div className="rejection-comment-box">
              <p>{getRejectionComment(commentsModalRow) || 'Sin comentario registrado.'}</p>
              <small>
                {getRejectionUser(commentsModalRow) ? `Usuario: ${getRejectionUser(commentsModalRow)}` : 'Usuario no registrado'}
                {' · '}
                {getRejectionDate(commentsModalRow) ? `Fecha: ${formatDateDDMMYYYY(getRejectionDate(commentsModalRow))}` : 'Fecha no registrada'}
              </small>
            </div>
          </div>
        </div>
      )}

      {coursesModalRow ? (
        <div className="modal-overlay" role="presentation">
          <section className="modal-content modal-content-large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h3>Etiquetas del SCORM</h3>
                <p>
                  {getOfficialName(coursesModalRow)} · {getInternationalizedCode(coursesModalRow)}
                </p>
              </div>
              <button type="button" className="secondary" onClick={() => setCoursesModalRow(null)}>
                Cerrar
              </button>
            </header>

            {getTagRowsForScorm(coursesModalRow).length === 0 ? (
              <p className="status">No hay etiquetas relacionadas para este SCORM.</p>
            ) : (
              <div className="tags-modal-grid">
                {getTagRowsForScorm(coursesModalRow).map((tag) => (
                  <span key={tag.etiqueta_codigo} className="category-chip" style={getCategoryColor(tag.clasificacion_scorm)}>
                    {tag.etiqueta_codigo} - {tag.etiqueta_nombre || 'Sin nombre'}
                  </span>
                ))}
              </div>
            )}
            <footer className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="secondary" onClick={() => setSingleTagPickerOpen((prev) => !prev)}>
                  + Añadir etiquetas
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    const currentCodes = parseTagCodesFromInput(String(coursesModalRow.scorm_etiquetas || '').replace(/;/g, ' '));
                    setSuggestedTagDraft(currentCodes);
                    setSuggestedTagsModalOpen(true);
                  }}
                >
                  Etiquetas sugeridas
                </button>
              </div>
              {singleTagPickerOpen ? (
                <button type="button" onClick={saveSingleScormTags} disabled={singleTagSubmitting || singleTagPickerDraft.length === 0}>
                  {singleTagSubmitting ? 'Guardando...' : `Añadir seleccionadas (${singleTagPickerDraft.length})`}
                </button>
              ) : null}
            </footer>
            {singleTagPickerOpen && (
              <div className="filter-lookup-menu">
                {selectedSingleTagRows.length > 0 && (
                  <div className="filter-lookup-options">
                    {selectedSingleTagRows.map((tagRow) => {
                      const code = String(tagRow.etiqueta_codigo || '').trim().toUpperCase();
                      return (
                        <button
                          key={`single-selected-${code}`}
                          type="button"
                          className="filter-lookup-option is-selected"
                          onClick={() => toggleTagCodeInDraft(setSingleTagPickerDraft, code)}
                          title="Quitar etiqueta seleccionada"
                        >
                          {code} - {tagRow.etiqueta_nombre || 'Sin nombre'} · Quitar
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="filter-lookup-search">
                  <input
                    type="text"
                    value={singleTagPickerSearch}
                    onChange={(event) => setSingleTagPickerSearch(event.target.value)}
                    placeholder="Buscar etiquetas..."
                  />
                </div>
                <div className="filter-lookup-options">
                  {singleTagPickerRows.map((tagRow) => {
                    const code = String(tagRow.etiqueta_codigo || '').trim().toUpperCase();
                    const selected = singleTagPickerDraft.includes(code);
                    return (
                      <button key={`single-tag-${code}`} type="button" className={`filter-lookup-option ${selected ? 'is-selected' : ''}`} onClick={() => toggleTagCodeInDraft(setSingleTagPickerDraft, code)}>
                        {code} - {tagRow.etiqueta_nombre || 'Sin nombre'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {coursesModalRow && suggestedTagsModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setSuggestedTagsModalOpen(false)}>
          <section className="modal-content modal-content-narrow" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h3>Etiquetas sugeridas</h3>
                <p>Clasificación: {coursesModalRow.scorm_categoria || 'Sin clasificación'}</p>
              </div>
              <button type="button" className="secondary" onClick={() => setSuggestedTagsModalOpen(false)}>
                Cerrar
              </button>
            </header>
            <div className="modal-footer" style={{ justifyContent: 'flex-start', gap: 8 }}>
              <button type="button" className="secondary" onClick={() => setSuggestedTagDraft(suggestedTagRows.map((row) => String(row.etiqueta_codigo || '').trim().toUpperCase()))} disabled={suggestedTagRows.length === 0}>
                Seleccionar todas
              </button>
              <button type="button" className="secondary" onClick={() => setSuggestedTagDraft([])} disabled={suggestedTagDraft.length === 0}>
                Borrar todas
              </button>
              <button type="button" onClick={applySuggestedTags} disabled={suggestedTagDraft.length === 0}>
                Añadir seleccionadas ({suggestedTagDraft.length})
              </button>
            </div>
            <div className="filter-lookup-options" style={{ maxHeight: 360, overflowY: 'auto' }}>
              {suggestedTagRows.length === 0 ? (
                <p className="status">No hay etiquetas sugeridas para esta clasificación.</p>
              ) : (
                suggestedTagRows.map((tagRow) => {
                  const code = String(tagRow.etiqueta_codigo || '').trim().toUpperCase();
                  const selected = suggestedTagDraft.includes(code);
                  return (
                    <button
                      key={`suggested-tag-${code}`}
                      type="button"
                      className={`filter-lookup-option ${selected ? 'is-selected' : ''}`}
                      onClick={() =>
                        setSuggestedTagDraft((previous) =>
                          previous.includes(code) ? previous.filter((item) => item !== code) : [...previous, code],
                        )
                      }
                      title={selected ? 'Quitar etiqueta sugerida' : 'Añadir etiqueta sugerida'}
                    >
                      {code} - {tagRow.etiqueta_nombre || 'Sin nombre'}
                      {selected ? ' · Quitar' : ''}
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
