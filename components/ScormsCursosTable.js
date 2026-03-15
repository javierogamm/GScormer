'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { exportRowsToExcel } from '../lib/excelExport';

const columns = [
  { key: 'curso_estado', label: 'Estado curso' },
  { key: 'codigo_individual', label: 'Código individual' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'subcategoria', label: 'Subcategoría' },
  { key: 'tipologia', label: 'Tipología' },
  { key: 'materia', label: 'Materia' },
  { key: 'pa_formaparte', label: 'PA Forma parte' },
  { key: 'pa_codigo', label: 'PA Código' },
  { key: 'pa_nombre', label: 'PA Nombre' },
  { key: 'pa_url', label: 'PA URL' },
  { key: 'pr_orden', label: 'PR Orden' },
  { key: 'ramas', label: 'Ramas' },
  { key: 'inscripcion', label: 'Inscripción' },
  { key: 'curso_codigo', label: 'Curso código' },
  { key: 'curso_idioma', label: 'Idioma curso' },
  { key: 'curso_instructor', label: 'Curso instructor' },
  { key: 'curso_inscripcion', label: 'Curso inscripción' },
  { key: 'observaciones', label: 'Observaciones' },
  { key: 'curso_observaciones', label: 'Curso observaciones' },
  { key: 'curso_descripcion', label: 'Curso descripción' },
  { key: 'tiempo_cert', label: 'Tiempo cert.' },
  { key: 'curso_url_ficha', label: 'URL ficha' },
  { key: 'curso_url', label: 'URL curso' },
  { key: 'contenido', label: 'Contenido' },
  { key: 'test', label: 'Test' },
  { key: 'existe', label: 'Existe' },
  { key: 'curso_nombre', label: 'Curso nombre' },
  { key: 'link_inscripcion', label: 'Link inscripción' },
];

const compactColumns = ['curso_estado', 'curso_codigo', 'curso_nombre', 'tipologia', 'materia', 'pa_nombre', 'curso_instructor', 'curso_url'];
const detailModalColumns = [
  ...columns.filter((column) => column.key !== 'curso_observaciones'),
  ...columns.filter((column) => column.key === 'curso_observaciones'),
];
const COURSE_STATUS_PENDING_VALIDATION = 'Pendiente de validación';
const COURSE_STATUS_PENDING = 'Pendiente de publicar';
const COURSE_STATUS_PUBLISHED = 'Publicado';
const COURSE_STATUS_IN_PROGRESS = 'En proceso';
const DEFAULT_LANGUAGES = ['ES', 'CAT', 'PT', 'GAL', 'IT'];
const DEFAULT_RELATION_TYPE_PARENT = 'PADRE';
const COURSE_SORT_OPTIONS = {
  created_desc: {
    label: 'Creación (más recientes)',
    compare: (left, right) => new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime(),
  },
  created_asc: {
    label: 'Creación (más antiguos)',
    compare: (left, right) => new Date(left.created_at || 0).getTime() - new Date(right.created_at || 0).getTime(),
  },
  updated_desc: {
    label: 'Edición (más recientes)',
    compare: (left, right) => new Date(right.updated_at || right.created_at || 0).getTime() - new Date(left.updated_at || left.created_at || 0).getTime(),
  },
  updated_asc: {
    label: 'Edición (más antiguas)',
    compare: (left, right) => new Date(left.updated_at || left.created_at || 0).getTime() - new Date(right.updated_at || right.created_at || 0).getTime(),
  },
  name_asc: {
    label: 'Nombre (A → Z)',
    compare: (left, right) => String(left.curso_nombre || '').localeCompare(String(right.curso_nombre || ''), 'es', { sensitivity: 'base' }),
  },
  name_desc: {
    label: 'Nombre (Z → A)',
    compare: (left, right) => String(right.curso_nombre || '').localeCompare(String(left.curso_nombre || ''), 'es', { sensitivity: 'base' }),
  },
};

const createCourseManagedSelectorFields = [
  { key: 'tipologia', label: 'Tipología' },
  { key: 'inscripcion', label: 'Inscripción' },
  { key: 'materia', label: 'Materia' },
  { key: 'curso_instructor', label: 'Instructor' },
];

const TIPOLOGY_VISIBILITY_OPTIONS = [
  { key: 'ESPUBLICO', label: 'Tipología ESPUBLICO' },
  { key: 'CERTIFICACION', label: 'Tipología CERTIFICACIÓN' },
  { key: 'INTERNO', label: 'Tipología INTERNO' },
  { key: 'GENERAL', label: 'Tipología GENERAL' },
];

const SELECT_FILTER_PRIORITY = ['curso_estado', 'tipologia', 'curso_instructor', 'materia', 'categoria'];

const normalizeLanguage = (language) => {
  const normalized = String(language || '').trim().toUpperCase();

  if (normalized === 'CA') {
    return 'CAT';
  }

  return normalized;
};

const normalizeText = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase();
};

const normalizeTipologia = (tipologia) => normalizeText(tipologia);

const rowIsPlanChild = (row) => {
  const normalizedMembership = normalizeText(row.pa_formaparte).toLowerCase();
  return ['si', 'sí', 'yes', 'true', '1', 'x'].includes(normalizedMembership);
};

const rowIsTranslationChild = (row) => normalizeText(row.relacion_tipo) === 'TRADUCCION';

const rowIsParentCourse = (row) => normalizeText(row.relacion_tipo) === 'PADRE';

const resolveTipologyGroup = (tipologia) => {
  const normalized = normalizeTipologia(tipologia);

  if (normalized === 'ESPUBLICO') {
    return 'ESPUBLICO';
  }

  if (normalized === 'CERTIFICACION') {
    return 'CERTIFICACION';
  }

  if (normalized === 'INTERNO' || normalized === 'USO INTERNO') {
    return 'INTERNO';
  }

  return 'GENERAL';
};

const isUrl = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized.startsWith('http://') || normalized.startsWith('https://');
};

const SCORM_CODE_REGEX = /(?:\b([a-z]{2,3})\s*[-_]\s*)?\b(SCR\d{4})\b/gi;

const formatFieldLabel = (key) => {
  return String(key || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getScormReferenceLabel = (row) => {
  const code = String(row.scorm_code || '').trim().toUpperCase();
  const language = String(row.scorm_idioma || '').trim().toUpperCase();

  if (!code) {
    return '';
  }

  return language ? `${language}-${code}` : code;
};

const normalizeAgentLabel = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
};

const splitInstructorValues = (instructorValue) => {
  return String(instructorValue || '')
    .split(/[&,;|]/)
    .map((value) => value.trim())
    .filter(Boolean);
};

const rowHasInstructorAgents = (row, agentNames = []) => {
  const normalizedAgents = agentNames.map((agentName) => normalizeAgentLabel(agentName)).filter(Boolean);
  if (normalizedAgents.length === 0) {
    return false;
  }

  const normalizedInstructors = splitInstructorValues(row.curso_instructor).map((instructor) => normalizeAgentLabel(instructor));

  return normalizedAgents.some((normalizedAgent) => {
    const exactMatch = normalizedInstructors.some((instructor) => instructor === normalizedAgent);

    if (exactMatch) {
      return true;
    }

    return normalizedInstructors.some((instructor) => instructor.includes(normalizedAgent));
  });
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

export default function ScormsCursosTable({ userSession }) {
  const [cursosSubView, setCursosSubView] = useState('general');
  const [translationPreset, setTranslationPreset] = useState('parents');
  const [pendingLanguage, setPendingLanguage] = useState('CAT');
  const [rows, setRows] = useState([]);
  const [masterRows, setMasterRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [filterInputs, setFilterInputs] = useState({});
  const [filters, setFilters] = useState({});
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [scormsModalRows, setScormsModalRows] = useState([]);
  const [detailModalRow, setDetailModalRow] = useState(null);
  const [detailDraft, setDetailDraft] = useState(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false);
  const [createPlanSubmitting, setCreatePlanSubmitting] = useState(false);
  const [relatedCreateModalOpen, setRelatedCreateModalOpen] = useState(false);
  const [relatedCreateSubmitting, setRelatedCreateSubmitting] = useState(false);
  const [relatedCreateUniqueId, setRelatedCreateUniqueId] = useState('');
  const [relatedRelationType, setRelatedRelationType] = useState('RELACIONADO');
  const [relatedCreateDraft, setRelatedCreateDraft] = useState({});
  const [translationCreateModalOpen, setTranslationCreateModalOpen] = useState(false);
  const [translationCreateSubmitting, setTranslationCreateSubmitting] = useState(false);
  const [translationCreateBulkMode, setTranslationCreateBulkMode] = useState(false);
  const [translationCreateLanguage, setTranslationCreateLanguage] = useState('CAT');
  const [translationCreateRows, setTranslationCreateRows] = useState([]);
  const [selectedTranslationParentIds, setSelectedTranslationParentIds] = useState([]);
  const [createDraft, setCreateDraft] = useState({
    curso_estado: COURSE_STATUS_IN_PROGRESS,
    curso_nombre: '',
    curso_codigo: '',
    curso_idioma: 'ES',
    tipologia: '',
    inscripcion: '',
    materia: '',
    curso_instructor: '',
    curso_url: '',
    curso_descripcion: '',
    link_inscripcion: '',
    observaciones: '',
    curso_observaciones: '',
    codigo_individual: '',
  });
  const [scormSearchText, setScormSearchText] = useState('');
  const [selectedScormIds, setSelectedScormIds] = useState([]);
  const [detailScormSearchText, setDetailScormSearchText] = useState('');
  const [detailSelectedScormIds, setDetailSelectedScormIds] = useState([]);
  const [planCourseSearchText, setPlanCourseSearchText] = useState('');
  const [selectedPlanCourseIds, setSelectedPlanCourseIds] = useState([]);
  const [createPlanDraft, setCreatePlanDraft] = useState({
    pa_nombre: '',
    pa_codigo: '',
    pa_url: '',
    pa_acronimo: '',
  });
  const [myCoursesOnly, setMyCoursesOnly] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const [selectedValidationCourseIds, setSelectedValidationCourseIds] = useState([]);
  const [courseSortOrder, setCourseSortOrder] = useState('created_desc');
  const [createManagedFieldMode, setCreateManagedFieldMode] = useState({});
  const [tipologyVisibility, setTipologyVisibility] = useState({
    ESPUBLICO: false,
    CERTIFICACION: true,
    INTERNO: true,
    GENERAL: true,
  });
  const [paDetailsModalRow, setPaDetailsModalRow] = useState(null);
  const scopedInstructorAgents = userSession?.agentFilters?.instructores || [];
  const canDeleteAsAdmin = userSession?.admin === true;
  const canValidateCourses = userSession?.validador === true;
  const canAccessValidationView = userSession?.admin === true || canValidateCourses;
  const canCreateManagedValues = userSession?.admin === true;

  const getDefaultCreateDraft = useCallback(
    () => ({
      curso_estado: COURSE_STATUS_IN_PROGRESS,
      curso_nombre: '',
      curso_codigo: '',
      curso_idioma: 'ES',
      tipologia: '',
      inscripcion: '',
      materia: '',
      curso_instructor: '',
      curso_url: '',
      curso_descripcion: '',
      link_inscripcion: '',
      observaciones: '',
      curso_observaciones: '',
      codigo_individual: '',
    }),
    [],
  );

  const getNextAvailableUniqueId = useCallback(() => {
    const maxSequence = rows.reduce((acc, row) => {
      const value = String(row.IDUnico ?? row.idunico ?? row.id_unico ?? '').trim().toUpperCase();
      const match = value.match(/^CU(\d{4})$/i);

      if (!match) {
        return acc;
      }

      return Math.max(acc, Number(match[1]));
    }, 0);

    return `CU${String(maxSequence + 1).padStart(4, '0')}`;
  }, [rows]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    const [cursosResponse, masterResponse] = await Promise.all([
      supabase.from('scorms_cursos').select('*').order('id', { ascending: true }),
      supabase.from('scorms_master').select('*').order('id', { ascending: true }),
    ]);

    if (cursosResponse.error) {
      setRows([]);
      setError(`No se pudieron cargar los cursos: ${cursosResponse.error.message}`);
    } else {
      setRows(cursosResponse.data || []);
      setStatusMessage(`Cursos cargados: ${(cursosResponse.data || []).length}`);
    }

    if (masterResponse.error) {
      setMasterRows([]);
      setError((previous) => previous || `No se pudieron cargar los SCORMs master: ${masterResponse.error.message}`);
    } else {
      setMasterRows(masterResponse.data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!detailModalRow) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [detailModalRow]);

  const prioritizedFilterColumns = useMemo(() => {
    const prioritizedSelectorColumns = SELECT_FILTER_PRIORITY
      .map((key) => columns.find((column) => column.key === key))
      .filter(Boolean);
    const highlightedKeys = ['curso_codigo', 'curso_nombre'];
    const highlighted = highlightedKeys
      .map((key) => columns.find((column) => column.key === key))
      .filter(Boolean);
    const hiddenSet = new Set([...SELECT_FILTER_PRIORITY, ...highlightedKeys]);
    const rest = columns.filter((column) => !hiddenSet.has(column.key));
    return [...prioritizedSelectorColumns, ...highlighted, { key: '__scorms__', label: 'SCORMS' }, ...rest];
  }, []);

  const selectorFilterOptions = useMemo(() => {
    return SELECT_FILTER_PRIORITY.reduce((acc, key) => {
      acc[key] = rows
        .map((row) => String(row[key] || '').trim())
        .filter(Boolean)
        .filter((value, index, array) => array.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index)
        .sort((left, right) => left.localeCompare(right, 'es', { sensitivity: 'base' }));
      return acc;
    }, {});
  }, [rows]);

  const scormsByCode = useMemo(() => {
    return masterRows.reduce((acc, row) => {
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
  }, [masterRows]);


  const getScormSearchableText = useCallback(
    (row) => {
      const references = extractScormReferencesFromContenido(row.contenido);
      const chunks = [];

      references.forEach((reference) => {
        const masterMatches = scormsByCode[reference.code] || [];

        masterMatches.forEach((match) => {
          const language = String(match.scorm_idioma || '').trim().toUpperCase();
          if (reference.language && language && reference.language !== language) {
            return;
          }

          chunks.push(
            [match.scorm_code, match.scorm_name, match.scorm_responsable, match.scorm_categoria, match.scorm_idioma]
              .map((value) => String(value || '').toLowerCase())
              .join(' '),
          );
        });
      });

      chunks.push(String(row.contenido || '').toLowerCase());
      return chunks.join(' ');
    },
    [scormsByCode],
  );

  const filteredRows = useMemo(() => {
    const activeFilterEntries = Object.entries(filters).filter(([, values]) => values.length > 0);

    return rows.filter((row) => {
      const matchesMyCourses = !myCoursesOnly || rowHasInstructorAgents(row, scopedInstructorAgents);
      if (!matchesMyCourses) {
        return false;
      }

      return activeFilterEntries.every(([columnKey, values]) => {
        const rowValue = columnKey === '__scorms__' ? getScormSearchableText(row) : String(row[columnKey] || '').toLowerCase();
        return values.every((value) => rowValue.includes(value.toLowerCase()));
      });
    });
  }, [rows, filters, myCoursesOnly, scopedInstructorAgents, getScormSearchableText]);


  const createManagedFieldOptions = useMemo(() => {
    return createCourseManagedSelectorFields.reduce((acc, field) => {
      const values = rows
        .map((row) => String(row[field.key] || '').trim())
        .filter(Boolean)
        .filter((value, index, array) => array.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index)
        .sort((left, right) => left.localeCompare(right, 'es', { sensitivity: 'base' }));

      acc[field.key] = values;
      return acc;
    }, {});
  }, [rows]);

  const sortedGeneralRows = useMemo(() => {
    const paChildrenCountByUniqueId = rows.reduce((acc, row) => {
      if (!rowIsPlanChild(row)) {
        return acc;
      }

      const uniqueId = String(row.IDUnico ?? row.idunico ?? row.id_unico ?? '').trim();
      if (!uniqueId) {
        return acc;
      }

      if (!acc[uniqueId]) {
        acc[uniqueId] = new Set();
      }

      const paKey = String(row.pa_codigo || row.pa_nombre || '').trim();
      if (paKey) {
        acc[uniqueId].add(paKey);
      }

      return acc;
    }, {});

    const sorter = COURSE_SORT_OPTIONS[courseSortOrder] || COURSE_SORT_OPTIONS.created_desc;

    const visibleRows = filteredRows
      .filter((row) => rowIsParentCourse(row))
      .filter((row) => {
        const tipologyGroup = resolveTipologyGroup(row.tipologia);
        return tipologyVisibility[tipologyGroup] === true;
      })
      .map((row) => {
        const uniqueId = String(row.IDUnico ?? row.idunico ?? row.id_unico ?? '').trim();
        const paCount = uniqueId && paChildrenCountByUniqueId[uniqueId] ? paChildrenCountByUniqueId[uniqueId].size : 0;

        return {
          ...row,
          pa_nombre: `${paCount > 0 ? '✓' : '✕'} (${paCount})`,
        };
      });

    return visibleRows.sort((left, right) => {
      const primary = sorter.compare(left, right);
      if (primary !== 0) {
        return primary;
      }

      return Number(left.id || 0) - Number(right.id || 0);
    });
  }, [courseSortOrder, filteredRows, rows, tipologyVisibility]);

  const activeScormMatches = useMemo(() => {
    if (scormsModalRows.length === 0) {
      return [];
    }

    const dedupedMatches = new Map();

    scormsModalRows.forEach((modalRow) => {
      const references = extractScormReferencesFromContenido(modalRow.contenido);

      references.forEach((reference) => {
        const masterMatches = scormsByCode[reference.code] || [];

        masterMatches.forEach((match) => {
          const language = String(match.scorm_idioma || '').trim().toUpperCase();
          if (reference.language && language && reference.language !== language) {
            return;
          }

          dedupedMatches.set(match.id, match);
        });
      });
    });

    return Array.from(dedupedMatches.values());
  }, [scormsByCode, scormsModalRows]);

  const filteredMasterScormRows = useMemo(() => {
    const search = String(scormSearchText || '').trim().toLowerCase();

    if (!search) {
      return masterRows;
    }

    return masterRows.filter((row) =>
      [row.scorm_code, row.scorm_name, row.scorm_responsable, row.scorm_categoria]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(search)),
    );
  }, [masterRows, scormSearchText]);

  const toggleSelectedScorm = (scormId) => {
    setSelectedScormIds((previous) => (previous.includes(scormId) ? previous.filter((id) => id !== scormId) : [...previous, scormId]));
  };

  const selectablePlanCourses = useMemo(() => {
    return rows.filter((row) => {
      const normalizedMembership = String(row.pa_formaparte || '').trim().toLowerCase();
      const isPartOfPlan = ['si', 'sí', 'yes', 'true', '1', 'x'].includes(normalizedMembership);
      return !isPartOfPlan;
    });
  }, [rows]);

  const filteredPlanCourses = useMemo(() => {
    const search = String(planCourseSearchText || '').trim().toLowerCase();

    if (!search) {
      return selectablePlanCourses;
    }

    return selectablePlanCourses.filter((row) =>
      [row.curso_codigo, row.curso_nombre, row.codigo_individual, row.materia, row.tipologia]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(search)),
    );
  }, [selectablePlanCourses, planCourseSearchText]);

  const toggleSelectedPlanCourse = (rowId) => {
    setSelectedPlanCourseIds((previous) => (previous.includes(rowId) ? previous.filter((id) => id !== rowId) : [...previous, rowId]));
  };

  const resetCreateCursoState = () => {
    setCreateModalOpen(false);
    setCreateSubmitting(false);
    setScormSearchText('');
    setSelectedScormIds([]);
    setCreateManagedFieldMode({});
    setCreateDraft(getDefaultCreateDraft());
  };

  const resetCreatePlanState = () => {
    setCreatePlanModalOpen(false);
    setCreatePlanSubmitting(false);
    setPlanCourseSearchText('');
    setSelectedPlanCourseIds([]);
    setCreatePlanDraft({
      pa_nombre: '',
      pa_codigo: '',
      pa_url: '',
      pa_acronimo: '',
    });
  };

  const openRelatedCreateModal = (row, uniqueId) => {
    const rowSource = row || {};
    const nextDraft = columns.reduce((acc, column) => {
      acc[column.key] = rowSource[column.key] ?? '';
      return acc;
    }, {});

    setRelatedCreateDraft(nextDraft);
    setRelatedCreateUniqueId(String(uniqueId || rowSource.IDUnico || rowSource.idunico || rowSource.id_unico || '').trim());
    setRelatedRelationType('RELACIONADO');
    setRelatedCreateSubmitting(false);
    setRelatedCreateModalOpen(true);
  };

  const resetRelatedCreateState = () => {
    setRelatedCreateModalOpen(false);
    setRelatedCreateSubmitting(false);
    setRelatedCreateUniqueId('');
    setRelatedRelationType('RELACIONADO');
    setRelatedCreateDraft({});
  };

  const toggleTranslationParentSelection = (rowId) => {
    setSelectedTranslationParentIds((previous) =>
      previous.includes(rowId) ? previous.filter((id) => id !== rowId) : [...previous, rowId],
    );
  };

  const openCreateTranslationModal = (sourceRows, isBulkMode) => {
    const validRows = (sourceRows || []).filter(Boolean);

    if (validRows.length === 0) {
      setError('No se pudieron resolver los cursos de origen para crear traducciones.');
      return;
    }

    const rowsDraft = validRows.map((row) => ({
      sourceId: row.id,
      uniqueId: String(row.IDUnico ?? row.idunico ?? row.id_unico ?? '').trim(),
      name: String(row.curso_nombre || ''),
      draft: columns.reduce((acc, column) => {
        acc[column.key] = row[column.key] ?? '';
        return acc;
      }, {}),
    }));

    setTranslationCreateRows(rowsDraft);
    setTranslationCreateLanguage('CAT');
    setTranslationCreateBulkMode(Boolean(isBulkMode));
    setTranslationCreateSubmitting(false);
    setTranslationCreateModalOpen(true);
    setError('');
  };

  const resetCreateTranslationState = () => {
    setTranslationCreateModalOpen(false);
    setTranslationCreateSubmitting(false);
    setTranslationCreateBulkMode(false);
    setTranslationCreateLanguage('CAT');
    setTranslationCreateRows([]);
  };



  const learningPlanGroups = useMemo(() => {
    const grouped = filteredRows.reduce((acc, row) => {
      const normalizedMembership = String(row.pa_formaparte || '').trim().toLowerCase();
      const isPartOfPlan = ['si', 'sí', 'yes', 'true', '1', 'x'].includes(normalizedMembership);

      if (!isPartOfPlan) {
        return acc;
      }

      const planCode = String(row.pa_codigo || '').trim();
      const planName = String(row.pa_nombre || '').trim();
      const key = planCode || planName;

      if (!key) {
        return acc;
      }

      if (!acc[key]) {
        acc[key] = {
          key,
          paCodigo: planCode || '-',
          paNombre: planName || '-',
          paUrl: String(row.pa_url || '').trim(),
          rows: [],
        };
      }

      if (!acc[key].paUrl) {
        acc[key].paUrl = String(row.pa_url || '').trim();
      }

      acc[key].rows.push(row);
      return acc;
    }, {});

    return Object.values(grouped)
      .filter((group) => {
        const normalizedName = String(group.paNombre || '').toLowerCase();
        return !normalizedName.includes('00') && !normalizedName.includes('cursos sin plan de aprendizaje');
      })
      .sort((left, right) => {
        const leftKey = `${left.paCodigo} ${left.paNombre}`;
        const rightKey = `${right.paCodigo} ${right.paNombre}`;
        return leftKey.localeCompare(rightKey, 'es', { sensitivity: 'base' });
      });
  }, [filteredRows]);

  const translationCourseGroups = useMemo(() => {
    const grouped = filteredRows.reduce((acc, row) => {
      const uniqueId = String(row.IDUnico ?? row.idunico ?? row.id_unico ?? '').trim();

      if (!uniqueId) {
        return acc;
      }

      if (!acc[uniqueId]) {
        acc[uniqueId] = [];
      }

      acc[uniqueId].push(row);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([uniqueId, groupRows]) => {
        const rowsByLanguage = groupRows.reduce((langAcc, row) => {
          const language = normalizeLanguage(row.curso_idioma);
          if (!language) {
            return langAcc;
          }

          if (!langAcc[language]) {
            langAcc[language] = row;
          }

          return langAcc;
        }, {});

        const languageSet = new Set(Object.keys(rowsByLanguage));
        const parentRow =
          groupRows.find((row) => String(row.relacion_tipo || '').trim().toLowerCase() === 'padre') ||
          rowsByLanguage.ES ||
          groupRows[0] ||
          {};

        return {
          uniqueId,
          rows: groupRows,
          rowsByLanguage,
          languageSet,
          parentRow,
        };
      })
      .sort((left, right) => left.uniqueId.localeCompare(right.uniqueId, 'es', { sensitivity: 'base' }));
  }, [filteredRows]);

  const translationAvailableLanguages = useMemo(() => {
    const set = new Set(DEFAULT_LANGUAGES);

    translationCourseGroups.forEach((group) => {
      Object.keys(group.rowsByLanguage).forEach((language) => {
        if (language) {
          set.add(language);
        }
      });
    });

    return Array.from(set).sort((left, right) => left.localeCompare(right, 'es', { sensitivity: 'base' }));
  }, [translationCourseGroups]);

  const translationRows = useMemo(() => {
    return translationCourseGroups
      .filter((group) => {
        if (translationPreset === 'parents') {
          return String(group.parentRow.relacion_tipo || '').trim().toLowerCase() === 'padre';
        }

        if (translationPreset === 'es_only') {
          return group.languageSet.size === 1 && group.languageSet.has('ES');
        }

        if (translationPreset === 'all_languages') {
          return DEFAULT_LANGUAGES.every((language) => group.languageSet.has(language));
        }

        if (translationPreset === 'only_language') {
          return group.languageSet.size === 1 && group.languageSet.has(pendingLanguage);
        }

        return false;
      })
      .map((group) => ({
        id: group.parentRow.id,
        uniqueId: group.uniqueId,
        cursoNombre: String(group.parentRow.curso_nombre || group.parentRow.curso_codigo || '-'),
        idioma: normalizeLanguage(group.parentRow.curso_idioma),
        row: group.parentRow,
        languageSummary: Array.from(group.languageSet).sort((left, right) => left.localeCompare(right, 'es', { sensitivity: 'base' })),
      }))
      .sort((left, right) => {
        const byId = left.uniqueId.localeCompare(right.uniqueId, 'es', { sensitivity: 'base' });
        if (byId !== 0) {
          return byId;
        }

        return left.cursoNombre.localeCompare(right.cursoNombre, 'es', { sensitivity: 'base' });
      });
  }, [pendingLanguage, translationAvailableLanguages, translationCourseGroups, translationPreset]);

  const relatedCourseGroups = useMemo(() => {
    const grouped = filteredRows.reduce((acc, row) => {
      const uniqueId = String(row.IDUnico ?? row.idunico ?? row.id_unico ?? '').trim();

      if (!uniqueId) {
        return acc;
      }

      if (!acc[uniqueId]) {
        acc[uniqueId] = [];
      }

      acc[uniqueId].push(row);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([uniqueId, groupRows]) => {
        const parentRow =
          groupRows.find((row) => String(row.relacion_tipo || '').trim().toLowerCase() === 'padre') || groupRows[0] || {};

        return {
          uniqueId,
          parentRow,
          rows: groupRows.sort((left, right) => {
            const leftName = String(left.curso_nombre || left.curso_codigo || left.id || '');
            const rightName = String(right.curso_nombre || right.curso_codigo || right.id || '');
            return leftName.localeCompare(rightName, 'es', { sensitivity: 'base' });
          }),
        };
      })
      .sort((left, right) => left.uniqueId.localeCompare(right.uniqueId, 'es', { sensitivity: 'base' }));
  }, [filteredRows]);


  const parseScormIdsFromContenido = useCallback(
    (contenido) => {
      const references = extractScormReferencesFromContenido(contenido);

      const ids = references
        .flatMap((reference) =>
          masterRows
            .filter((masterRow) => {
              const code = String(masterRow.scorm_code || '').trim().toUpperCase();
              const language = String(masterRow.scorm_idioma || '').trim().toUpperCase();

              if (code !== reference.code) {
                return false;
              }

              if (reference.language && language && reference.language !== language) {
                return false;
              }

              return true;
            })
            .map((masterRow) => masterRow.id),
        )
        .filter(Boolean);

      return Array.from(new Set(ids));
    },
    [masterRows],
  );

  const filteredDetailMasterScormRows = useMemo(() => {
    const search = String(detailScormSearchText || '').trim().toLowerCase();

    if (!search) {
      return masterRows;
    }

    return masterRows.filter((row) =>
      [row.scorm_code, row.scorm_name, row.scorm_responsable, row.scorm_categoria]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(search)),
    );
  }, [detailScormSearchText, masterRows]);

  const toggleDetailSelectedScorm = (scormId) => {
    setDetailSelectedScormIds((previous) => (previous.includes(scormId) ? previous.filter((id) => id !== scormId) : [...previous, scormId]));
  };

  const openDetailModal = (row) => {
    setDetailModalRow(row);
    setDetailDraft({ ...row });
    setDetailScormSearchText('');
    setDetailSelectedScormIds(parseScormIdsFromContenido(row?.contenido));
  };

  const closeDetailModal = () => {
    if (detailSaving) {
      return;
    }

    setDetailModalRow(null);
    setDetailDraft(null);
    setDetailScormSearchText('');
    setDetailSelectedScormIds([]);
  };

  const saveDetailModal = async () => {
    if (!detailModalRow || !detailDraft) {
      return;
    }

    const payload = columns.reduce((acc, column) => {
      acc[column.key] = detailDraft[column.key] ?? null;
      return acc;
    }, {});

    payload.curso_observaciones = payload.observaciones;
    payload.contenido = detailSelectedScormIds
      .map((id) => masterRows.find((row) => row.id === id))
      .filter(Boolean)
      .map((row) => getScormReferenceLabel(row))
      .filter(Boolean)
      .join(', ');

    if (String(payload.curso_estado || '').trim() === COURSE_STATUS_PENDING && !canValidateCourses) {
      setError('Solo los usuarios validador pueden pasar cursos a "Pendiente de publicar".');
      return;
    }

    setDetailSaving(true);
    setError('');

    const response = await supabase.from('scorms_cursos').update(payload).eq('id', detailModalRow.id).select('*').single();

    if (response.error) {
      setDetailSaving(false);
      setError(`No se pudieron guardar los cambios del curso: ${response.error.message}`);
      return;
    }

    setRows((previousRows) => previousRows.map((row) => (row.id === detailModalRow.id ? response.data : row)));
    setStatusMessage(`Curso actualizado: ${response.data.curso_nombre || response.data.curso_codigo || `ID ${response.data.id}`}`);
    setDetailSaving(false);
    setDetailModalRow(response.data);
    setDetailDraft({ ...response.data });
  };


  const deleteCourse = async (row) => {
    if (!canDeleteAsAdmin) {
      setError('Solo los usuarios ADMIN pueden eliminar cursos.');
      setStatusMessage('');
      return;
    }

    if (!row?.id) {
      return;
    }

    const courseLabel = String(row.curso_nombre || row.curso_codigo || `ID ${row.id}`);
    const confirmation = globalThis?.confirm(`¿Eliminar el curso ${courseLabel}? Esta acción no se puede deshacer.`);

    if (!confirmation) {
      return;
    }

    setError('');
    setStatusMessage('');

    const { error: deleteError } = await supabase.from('scorms_cursos').delete().eq('id', row.id);

    if (deleteError) {
      setError(`No se pudo eliminar el curso: ${deleteError.message}`);
      return;
    }

    setRows((previousRows) => previousRows.filter((currentRow) => currentRow.id !== row.id));
    closeDetailModal();
    setStatusMessage(`Curso eliminado: ${courseLabel}`);
  };

  const pendingPublishRows = useMemo(
    () => filteredRows.filter((row) => String(row.curso_estado || '').trim() === COURSE_STATUS_PENDING),
    [filteredRows],
  );

  const pendingValidationRows = useMemo(
    () => filteredRows.filter((row) => String(row.curso_estado || '').trim() === COURSE_STATUS_PENDING_VALIDATION),
    [filteredRows],
  );

  useEffect(() => {
    const ids = new Set(pendingValidationRows.map((row) => row.id));
    setSelectedValidationCourseIds((previous) => previous.filter((rowId) => ids.has(rowId)));
  }, [pendingValidationRows]);

  const publishCoursesCount = pendingPublishRows.length;
  const validationCoursesCount = pendingValidationRows.length;

  const changeCourseStatus = async (row, nextStatus, successMessage) => {
    const currentStatus = String(row.curso_estado || '').trim() || COURSE_STATUS_IN_PROGRESS;

    if (currentStatus === nextStatus) {
      return;
    }

    if (nextStatus === COURSE_STATUS_PENDING && !canValidateCourses) {
      setError('Solo los usuarios validador pueden pasar cursos a "Pendiente de publicar".');
      return;
    }

    const response = await supabase.from('scorms_cursos').update({ curso_estado: nextStatus }).eq('id', row.id);

    if (response.error) {
      setError(`No se pudo actualizar el estado del curso: ${response.error.message}`);
      return;
    }

    setRows((previousRows) =>
      previousRows.map((item) =>
        item.id === row.id
          ? {
              ...item,
              curso_estado: nextStatus,
            }
          : item,
      ),
    );

    setMoveHistory((previous) => [...previous, { rowId: row.id, from: currentStatus, to: nextStatus }]);
    setRedoHistory([]);
    setStatusMessage(successMessage);
    setError('');
  };

  const setCoursePendingValidation = async (row) => {
    await changeCourseStatus(
      row,
      COURSE_STATUS_PENDING_VALIDATION,
      `Curso movido a pendiente de validación: ${row.curso_nombre || row.curso_codigo || `ID ${row.id}`}`,
    );
  };

  const moveCourseToPendingPublish = async (row) => {
    await changeCourseStatus(
      row,
      COURSE_STATUS_PENDING,
      `Curso validado y movido a pendiente de publicar: ${row.curso_nombre || row.curso_codigo || `ID ${row.id}`}`,
    );
  };

  const moveSelectedValidationCoursesToPendingPublish = async () => {
    if (selectedValidationCourseIds.length === 0) {
      setError('Selecciona uno o más cursos pendientes de validación.');
      return;
    }

    const rowsToMove = pendingValidationRows.filter((row) => selectedValidationCourseIds.includes(row.id));

    for (const row of rowsToMove) {
      // eslint-disable-next-line no-await-in-loop
      await moveCourseToPendingPublish(row);
    }

    setSelectedValidationCourseIds([]);
  };

  const publishCourse = async (row) => {
    await changeCourseStatus(
      row,
      COURSE_STATUS_PUBLISHED,
      `Curso publicado: ${row.curso_nombre || row.curso_codigo || `ID ${row.id}`}`,
    );
  };

  const handleUndo = async () => {
    const moveToRestore = moveHistory[moveHistory.length - 1];
    if (!moveToRestore) {
      return;
    }

    const response = await supabase.from('scorms_cursos').update({ curso_estado: moveToRestore.from }).eq('id', moveToRestore.rowId);

    if (response.error) {
      setError(`No se pudo deshacer el cambio de estado: ${response.error.message}`);
      return;
    }

    setRows((previousRows) =>
      previousRows.map((item) =>
        item.id === moveToRestore.rowId
          ? {
              ...item,
              curso_estado: moveToRestore.from,
            }
          : item,
      ),
    );
    setMoveHistory((previous) => previous.slice(0, -1));
    setRedoHistory((previous) => [...previous, moveToRestore]);
    setStatusMessage('Deshacer aplicado correctamente.');
    setError('');
  };

  const handleRedo = async () => {
    const moveToRestore = redoHistory[redoHistory.length - 1];
    if (!moveToRestore) {
      return;
    }

    const response = await supabase.from('scorms_cursos').update({ curso_estado: moveToRestore.to }).eq('id', moveToRestore.rowId);

    if (response.error) {
      setError(`No se pudo rehacer el cambio de estado: ${response.error.message}`);
      return;
    }

    setRows((previousRows) =>
      previousRows.map((item) =>
        item.id === moveToRestore.rowId
          ? {
              ...item,
              curso_estado: moveToRestore.to,
            }
          : item,
      ),
    );
    setRedoHistory((previous) => previous.slice(0, -1));
    setMoveHistory((previous) => [...previous, moveToRestore]);
    setStatusMessage('Rehacer aplicado correctamente.');
    setError('');
  };

  const submitCreateCurso = async () => {
    const cursoNombre = String(createDraft.curso_nombre || '').trim();

    if (!cursoNombre) {
      setError('El nombre del curso es obligatorio para crear un nuevo registro.');
      return;
    }

    const contenidoScorm = selectedScormIds
      .map((id) => masterRows.find((row) => row.id === id))
      .filter(Boolean)
      .map((row) => getScormReferenceLabel(row))
      .filter(Boolean)
      .join(', ');

    const payload = {
      ...createDraft,
      curso_observaciones: createDraft.observaciones,
      IDUnico: getNextAvailableUniqueId(),
      relacion_tipo: DEFAULT_RELATION_TYPE_PARENT,
      contenido: contenidoScorm,
    };

    if (String(payload.curso_estado || '').trim() === COURSE_STATUS_PENDING && !canValidateCourses) {
      setError('Solo los usuarios validador pueden crear cursos en "Pendiente de publicar".');
      return;
    }

    setCreateSubmitting(true);
    setError('');

    const response = await supabase.from('scorms_cursos').insert(payload).select('*').single();

    if (response.error) {
      setCreateSubmitting(false);
      setError(`No se pudo crear el curso: ${response.error.message}`);
      return;
    }

    setRows((previous) => [...previous, response.data]);
    setStatusMessage(`Curso creado: ${response.data.curso_nombre || 'Sin nombre'}`);
    resetCreateCursoState();
  };

  const submitCreateRelatedCurso = async () => {
    const cursoNombre = String(relatedCreateDraft.curso_nombre || '').trim();
    const uniqueId = String(relatedCreateUniqueId || '').trim();
    const relationType = String(relatedRelationType || '').trim();

    if (!uniqueId) {
      setError('No se pudo resolver el IDUnico del curso padre.');
      return;
    }

    if (!cursoNombre) {
      setError('El nombre del curso es obligatorio para crear el curso relacionado.');
      return;
    }

    if (!relationType) {
      setError('El tipo de relación es obligatorio.');
      return;
    }

    const payload = {
      ...relatedCreateDraft,
      IDUnico: uniqueId,
      relacion_tipo: relationType,
    };

    setRelatedCreateSubmitting(true);
    setError('');

    const response = await supabase.from('scorms_cursos').insert(payload).select('*').single();

    if (response.error) {
      setRelatedCreateSubmitting(false);
      setError(`No se pudo crear el curso relacionado: ${response.error.message}`);
      return;
    }

    setRows((previous) => [...previous, response.data]);
    setStatusMessage(`Curso relacionado creado: ${response.data.curso_nombre || response.data.curso_codigo || `ID ${response.data.id}`}`);
    resetRelatedCreateState();
  };

  const submitCreateTranslation = async () => {
    const language = normalizeLanguage(translationCreateLanguage);

    if (!language) {
      setError('El idioma de traducción es obligatorio.');
      return;
    }

    if (translationCreateRows.length === 0) {
      setError('No hay cursos seleccionados para crear traducción.');
      return;
    }

    const payload = translationCreateRows.map((row) => {
      const cursoNombre = String(row.name || '').trim();

      return {
        ...row.draft,
        IDUnico: row.uniqueId,
        relacion_tipo: 'Traducción',
        curso_idioma: language,
        curso_nombre: cursoNombre,
      };
    });

    const hasInvalidName = payload.some((row) => !String(row.curso_nombre || '').trim());
    if (hasInvalidName) {
      setError('El nombre del curso es obligatorio en todas las traducciones.');
      return;
    }

    setTranslationCreateSubmitting(true);
    setError('');

    const response = await supabase.from('scorms_cursos').insert(payload).select('*');

    if (response.error) {
      setTranslationCreateSubmitting(false);
      setError(`No se pudo crear la traducción: ${response.error.message}`);
      return;
    }

    setRows((previous) => [...previous, ...(response.data || [])]);
    setSelectedTranslationParentIds([]);
    setStatusMessage(`Traducciones creadas: ${(response.data || []).length}`);
    resetCreateTranslationState();
  };

  const submitCreatePlan = async () => {
    const paNombre = String(createPlanDraft.pa_nombre || '').trim();
    const paCodigo = String(createPlanDraft.pa_codigo || '').trim();
    const paUrl = String(createPlanDraft.pa_url || '').trim();
    const paAcronimo = String(createPlanDraft.pa_acronimo || '').trim().toUpperCase();

    if (!paNombre) {
      setError('El nombre del plan de aprendizaje es obligatorio.');
      return;
    }

    if (!paCodigo) {
      setError('El código del plan de aprendizaje es obligatorio.');
      return;
    }

    if (!paAcronimo) {
      setError('El acrónimo del PA es obligatorio para generar el nuevo código del curso.');
      return;
    }

    if (selectedPlanCourseIds.length === 0) {
      setError('Selecciona al menos un curso para añadir al plan de aprendizaje.');
      return;
    }

    const selectedRows = rows.filter((row) => selectedPlanCourseIds.includes(row.id));

    if (selectedRows.length === 0) {
      setError('No se pudieron resolver los cursos seleccionados para el plan de aprendizaje.');
      return;
    }

    const payload = selectedRows.map((row) => {
      const baseCode = String(row.curso_codigo || '').trim();
      const nextCourseCode = baseCode ? `${paAcronimo}-${baseCode}` : paAcronimo;

      return {
        ...columns.reduce((acc, column) => {
          acc[column.key] = row[column.key] ?? null;
          return acc;
        }, {}),
        pa_formaparte: 'Sí',
        pa_codigo: paCodigo,
        pa_nombre: paNombre,
        pa_url: paUrl,
        curso_codigo: nextCourseCode,
      };
    });

    setCreatePlanSubmitting(true);
    setError('');

    const response = await supabase.from('scorms_cursos').insert(payload).select('*');

    if (response.error) {
      setCreatePlanSubmitting(false);
      setError(`No se pudo crear el plan de aprendizaje: ${response.error.message}`);
      return;
    }

    setRows((previous) => [...previous, ...(response.data || [])]);
    setStatusMessage(
      `Plan de aprendizaje creado: ${paNombre} · Cursos añadidos: ${(response.data || []).length}`,
    );
    resetCreatePlanState();
  };
  const handleFilterInputChange = (columnKey, value) => {
    setFilterInputs((previous) => ({
      ...previous,
      [columnKey]: value,
    }));
  };

  const addFilter = (columnKey) => {
    const currentValue = String(filterInputs[columnKey] || '').trim();

    if (!currentValue) {
      return;
    }

    setFilters((previous) => {
      const existingValues = previous[columnKey] || [];
      if (existingValues.includes(currentValue)) {
        return previous;
      }

      return {
        ...previous,
        [columnKey]: [...existingValues, currentValue],
      };
    });

    setFilterInputs((previous) => ({
      ...previous,
      [columnKey]: '',
    }));
  };

  const openPaDetailsModal = (row) => {
    const uniqueId = String(row.IDUnico ?? row.idunico ?? row.id_unico ?? '').trim();

    const paRows = rows.filter((candidate) => {
      const candidateUniqueId = String(candidate.IDUnico ?? candidate.idunico ?? candidate.id_unico ?? '').trim();
      return candidateUniqueId === uniqueId && rowIsPlanChild(candidate);
    });

    const groupedPa = paRows.reduce((acc, paRow) => {
      const key = String(paRow.pa_codigo || paRow.pa_nombre || '').trim();
      if (!key) {
        return acc;
      }

      if (!acc[key]) {
        acc[key] = {
          key,
          paCodigo: String(paRow.pa_codigo || '-').trim() || '-',
          paNombre: String(paRow.pa_nombre || '-').trim() || '-',
          paUrl: String(paRow.pa_url || '').trim(),
        };
      }

      if (!acc[key].paUrl) {
        acc[key].paUrl = String(paRow.pa_url || '').trim();
      }

      return acc;
    }, {});

    setPaDetailsModalRow({
      cursoNombre: String(row.curso_nombre || row.curso_codigo || '-'),
      uniqueId,
      paGroups: Object.values(groupedPa).sort((left, right) => {
        const leftLabel = `${left.paCodigo} ${left.paNombre}`;
        const rightLabel = `${right.paCodigo} ${right.paNombre}`;
        return leftLabel.localeCompare(rightLabel, 'es', { sensitivity: 'base' });
      }),
    });
  };

  const removeFilter = (columnKey, valueToRemove) => {
    setFilters((previous) => {
      const nextValues = (previous[columnKey] || []).filter((value) => value !== valueToRemove);

      if (nextValues.length === 0) {
        const { [columnKey]: _removed, ...rest } = previous;
        return rest;
      }

      return {
        ...previous,
        [columnKey]: nextValues,
      };
    });
  };

  const clearFiltersForColumn = (columnKey) => {
    setFilters((previous) => {
      const { [columnKey]: _removed, ...rest } = previous;
      return rest;
    });
  };

  const toggleCellFilter = (columnKey, rawValue) => {
    const normalizedValue = String(rawValue || '').trim();

    if (!normalizedValue || normalizedValue === '-') {
      return;
    }

    setFilters((previous) => {
      const existingValues = previous[columnKey] || [];
      const alreadyExists = existingValues.some((value) => value.toLowerCase() === normalizedValue.toLowerCase());

      if (alreadyExists) {
        const nextValues = existingValues.filter((value) => value.toLowerCase() !== normalizedValue.toLowerCase());
        if (nextValues.length === 0) {
          const { [columnKey]: _removed, ...rest } = previous;
          return rest;
        }

        return {
          ...previous,
          [columnKey]: nextValues,
        };
      }

      return {
        ...previous,
        [columnKey]: [...existingValues, normalizedValue],
      };
    });
  };

  const handleExportCursosGeneralExcel = () => {
    const exported = exportRowsToExcel({
      rows: filteredRows,
      preferredKeys: columns.map((column) => column.key),
      sheetName: 'cursos_general',
      fileName: `cursos_general_${new Date().toISOString().slice(0, 10)}.xls`,
    });

    if (!exported) {
      setStatusMessage('No hay cursos en la vista general para exportar.');
      return;
    }

    setStatusMessage(`Exportación Excel generada correctamente (${filteredRows.length} cursos).`);
  };

  return (
    <section className="card card-wide">
      <div className="card-header">
        <div>
          <h2>
            CURSOS ·{' '}
            {cursosSubView === 'general'
              ? 'Vista general'
                              : cursosSubView === 'planes'
                  ? 'Planes de aprendizaje'
                  : cursosSubView === 'relaciones'
                    ? 'Cursos relacionados'
                    : cursosSubView === 'traducciones'
                      ? 'Traducciones'
                       : cursosSubView === 'validacion'
                        ? 'Validación pendiente'
                        : 'Publicación pendiente'}
          </h2>
          <p className="status">Vista conectada a la tabla `scorms_cursos`.</p>
        </div>
        <div className="header-actions cursos-header-actions">
          <div className="header-actions-row">
            <button
              type="button"
              className={`secondary view-select-button ${cursosSubView === 'general' ? 'is-selected' : ''}`}
              onClick={() => setCursosSubView('general')}
            >
              Vista general
            </button>
            <button
              type="button"
              className={`secondary view-select-button ${cursosSubView === 'planes' ? 'is-selected' : ''}`}
              onClick={() => setCursosSubView('planes')}
            >
              Planes de aprendizaje
            </button>
            <button
              type="button"
              className={`secondary view-select-button ${cursosSubView === 'relaciones' ? 'is-selected' : ''}`}
              onClick={() => setCursosSubView('relaciones')}
            >
              Cursos relacionados
            </button>
            <button
              type="button"
              className={`secondary view-select-button ${cursosSubView === 'traducciones' ? 'is-selected' : ''}`}
              onClick={() => setCursosSubView('traducciones')}
            >
              Traducciones
            </button>
            {canAccessValidationView ? (
              <button
                type="button"
                className={`secondary view-select-button ${cursosSubView === 'validacion' ? 'is-selected' : ''} ${validationCoursesCount > 0 ? 'pending-highlight' : ''}`}
                onClick={() => setCursosSubView('validacion')}
              >
                Validación pendiente
                <span className="preset-kpi-badge" title="Cursos pendientes de validación">
                  {validationCoursesCount}
                </span>
              </button>
            ) : null}
            <button
              type="button"
              className={`secondary view-select-button ${cursosSubView === 'publicacion' ? 'is-selected' : ''} ${publishCoursesCount > 0 ? 'pending-highlight' : ''}`}
              onClick={() => setCursosSubView('publicacion')}
            >
              Publicación pendiente
              <span className="preset-kpi-badge" title="Cursos pendientes de publicar">
                {publishCoursesCount}
              </span>
            </button>
          </div>
          <div className="header-actions-row">
            <button
              type="button"
              className={`secondary action-select-button ${myCoursesOnly ? 'is-selected' : ''}`}
              onClick={() => setMyCoursesOnly((previous) => !previous)}
              disabled={scopedInstructorAgents.length === 0}
              title={
                scopedInstructorAgents.length > 0
                  ? `Filtrar por instructores asociados (${scopedInstructorAgents.length})`
                  : 'Tu usuario no tiene instructores asociados'
              }
            >
              Mis cursos
            </button>
            <button type="button" className="secondary action-select-button" onClick={() => { setCreateManagedFieldMode({}); setCreateModalOpen(true); }}>
              Crear Curso
            </button>
            {cursosSubView === 'planes' ? (
              <button type="button" className="secondary action-select-button" onClick={() => setCreatePlanModalOpen(true)}>
                Crear Plan de aprendizaje
              </button>
            ) : null}
            <button className="secondary action-select-button" onClick={fetchData} disabled={loading}>
              {loading ? 'Cargando...' : 'Refrescar'}
            </button>
            {cursosSubView === 'general' ? (
              <button type="button" className="secondary action-select-button" onClick={handleExportCursosGeneralExcel}>
                Exportar Excel
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {myCoursesOnly && scopedInstructorAgents.length > 0 ? (
        <p className="status">Filtro activo por instructores: {scopedInstructorAgents.join(', ')}</p>
      ) : null}

      {statusMessage ? <p className="status ok">{statusMessage}</p> : null}
      {error ? <p className="status error">{error}</p> : null}

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
            {Object.values(filters).flat().length > 0 ? <span className="filter-counter">{Object.values(filters).flat().length}</span> : null}
          </div>
          <span className="filter-collapse-label">{filtersCollapsed ? 'Expandir' : 'Colapsar'}</span>
        </div>

        <div className={`filters-panel-body ${filtersCollapsed ? 'filters-panel-body-collapsed' : ''}`}>
          <div className="filters-grid compact">
          {prioritizedFilterColumns.map((column) => {
            const appliedFilters = filters[column.key] || [];

            return (
              <div key={column.key} className="filter-dropdown filter-card">
                <div className="filter-card-header">
                  <span>{column.label}</span>
                  {appliedFilters.length > 0 ? <span className="filter-counter">{appliedFilters.length}</span> : null}
                </div>
                <div className="filter-dropdown-content">
                  <div className="filter-controls">
                    {SELECT_FILTER_PRIORITY.includes(column.key) ? (
                      <select value={filterInputs[column.key] || ''} onChange={(event) => handleFilterInputChange(column.key, event.target.value)}>
                        <option value="">Selecciona...</option>
                        {(selectorFilterOptions[column.key] || []).map((option) => (
                          <option key={`filter-option-${column.key}-${option}`} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={filterInputs[column.key] || ''}
                        onChange={(event) => handleFilterInputChange(column.key, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            addFilter(column.key);
                          }
                        }}
                        placeholder={`Añadir filtro en ${column.label}`}
                      />
                    )}
                    <button type="button" className="secondary" onClick={() => addFilter(column.key)}>
                      Añadir
                    </button>
                  </div>

                  {appliedFilters.length > 0 ? (
                    <>
                      <div className="filter-tags">
                        {appliedFilters.map((value) => (
                          <button
                            key={`${column.key}-${value}`}
                            type="button"
                            className="filter-tag"
                            onClick={() => removeFilter(column.key, value)}
                          >
                            {value} ✕
                          </button>
                        ))}
                      </div>
                      <button type="button" className="clear-filters" onClick={() => clearFiltersForColumn(column.key)}>
                        Quitar filtros
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </section>

      {cursosSubView === 'general' ? (
        <section className="tipology-visibility-panel">
          <strong>Mostrar tipologías</strong>
          <div className="tipology-visibility-grid">
            {TIPOLOGY_VISIBILITY_OPTIONS.map((option) => (
              <label key={`tipology-visibility-${option.key}`} className="tipology-visibility-item">
                <input
                  type="checkbox"
                  checked={tipologyVisibility[option.key] === true}
                  onChange={() => {
                    setTipologyVisibility((previous) => ({
                      ...previous,
                      [option.key]: !previous[option.key],
                    }));
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {cursosSubView === 'general' ? (
        <>
          <div className="details-grid" style={{ marginBottom: '0.8rem' }}>
            <label>
              <span>Ordenar cursos</span>
              <select value={courseSortOrder} onChange={(event) => setCourseSortOrder(event.target.value)}>
                {Object.entries(COURSE_SORT_OPTIONS).map(([key, config]) => (
                  <option key={`course-sort-${key}`} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="table-wrapper">
            <table className="cursos-table compact-rows">
              <thead>
                <tr>
                  <th>SCORMs</th>
                  {compactColumns.map((columnKey) => {
                    const column = columns.find((item) => item.key === columnKey);
                    return <th key={column.key}>{column.label}</th>;
                  })}
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {sortedGeneralRows.map((row) => (
                    <tr key={`row-${row.id}`} onDoubleClick={() => openDetailModal(row)}>
                      <td>
                            <button type="button" className="secondary" onClick={() => setScormsModalRows([row])}>
                              Scorms
                            </button>
                      </td>
                      {compactColumns.map((columnKey) => {
                        const value = row[columnKey];
                        const isPaSummaryColumn = columnKey === 'pa_nombre';
                        const hasActiveValueFilter = (filters[columnKey] || []).some(
                          (filterValue) => filterValue.toLowerCase() === String(value || '').trim().toLowerCase(),
                        );

                        return (
                          <td
                            key={`${row.id}-${columnKey}`}
                            className={`${columnKey === 'curso_nombre' ? 'col-curso_nombre' : ''} ${isPaSummaryColumn ? '' : 'cell-selectable'} ${hasActiveValueFilter && !isPaSummaryColumn ? 'cell-selected' : ''}`}
                            onClick={() => {
                              if (!isPaSummaryColumn) {
                                toggleCellFilter(columnKey, value);
                              }
                            }}
                            title={isPaSummaryColumn ? '' : 'Click para filtrar por este valor'}
                          >
                            {columnKey === 'pa_nombre' ? (
                              <button
                                type="button"
                                className={`pa-status-button ${String(value || '').trim().startsWith('✓') ? 'ok' : 'error'}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openPaDetailsModal(row);
                                }}
                              >
                                {String(value || '-')}
                              </button>
                            ) : columnKey === 'curso_url' && isUrl(value) ? (
                              <a className="table-link" href={value} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                                LINK
                              </a>
                            ) : isUrl(value) ? (
                              <a className="table-link" href={value} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                                Abrir enlace
                              </a>
                            ) : (
                              String(value || '-')
                            )}
                          </td>
                        );
                      })}
                      <td className="first-col-detail">
                        <div className="row-actions">
                          {String(row.curso_estado || '').trim() === COURSE_STATUS_IN_PROGRESS ? (
                            <button type="button" className="secondary action-button" onClick={() => setCoursePendingValidation(row)}>
                              Pasar a pendiente de validación
                            </button>
                          ) : null}
                          <button type="button" className="secondary" onClick={() => openDetailModal(row)}>
                            Detalles
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sortedGeneralRows.length === 0 ? <p className="status">No hay registros que coincidan con los filtros actuales.</p> : null}
        </>
      ) : cursosSubView === 'planes' ? (
        <section className="individuales-view">
          {learningPlanGroups.length === 0 ? <p className="status">No hay planes de aprendizaje para los filtros aplicados.</p> : null}
          <div className="scorms-accordion-list">
            {learningPlanGroups.map((group) => (
              <details key={`plan-${group.key}`} className="scorms-accordion-item individual-course-group">
                <summary>
                  <span className="individual-summary-grid">
                    <strong>{group.paCodigo}</strong>
                    <span>{group.paNombre}</span>
                    <span>
                      {isUrl(group.paUrl) ? (
                        <a
                          className="table-link"
                          href={group.paUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                        >
                          LINK
                        </a>
                      ) : (
                        'LINK'
                      )}{' '}
                      ({group.rows.length})
                    </span>
                  </span>
                </summary>
                <div className="table-wrapper individual-inner-table-wrapper">
                  <table className="cursos-table compact-rows individual-inner-table">
                    <thead>
                      <tr>
                        <th>Curso código</th>
                        <th>Curso nombre</th>
                        <th>Tipología</th>
                        <th>Estado</th>
                        <th>Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr key={`plan-row-${group.key}-${row.id}`} onDoubleClick={() => openDetailModal(row)}>
                          <td>{String(row.curso_codigo || '-')}</td>
                          <td>{String(row.curso_nombre || '-')}</td>
                          <td>{String(row.tipologia || '-')}</td>
                          <td>{String(row.curso_estado || '-')}</td>
                          <td>
                            <div className="row-actions">
                              {String(row.curso_estado || '').trim() === COURSE_STATUS_IN_PROGRESS ? (
                                <button type="button" className="secondary action-button" onClick={() => setCoursePendingValidation(row)}>
                                  Pasar a pendiente de validación
                                </button>
                              ) : null}
                              <button type="button" className="secondary" onClick={() => openDetailModal(row)}>
                                Detalles
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : cursosSubView === 'relaciones' ? (
        <section className="individuales-view">
          {relatedCourseGroups.length === 0 ? <p className="status">No hay relaciones por ID único para los filtros aplicados.</p> : null}
          <div className="scorms-accordion-list">
            {relatedCourseGroups.map((group) => (
              <details key={`relacion-${group.uniqueId}`} className="scorms-accordion-item individual-course-group">
                <summary>
                  <span className="individual-summary-actions">
                    <span className="individual-summary-grid">
                      <strong>IDUnico: {group.uniqueId}</strong>
                      <span>{String(group.parentRow.curso_nombre || '-')}</span>
                      <span>{String(group.parentRow.curso_instructor || '-')}</span>
                      <span>({group.rows.length})</span>
                    </span>
                    <button
                      type="button"
                      className="secondary action-select-button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openRelatedCreateModal(group.parentRow, group.uniqueId);
                      }}
                    >
                      Crear curso relacionado
                    </button>
                  </span>
                </summary>
                <div className="table-wrapper individual-inner-table-wrapper">
                  <table className="cursos-table compact-rows individual-inner-table">
                    <thead>
                      <tr>
                        <th>IDUnico</th>
                        <th>Curso nombre</th>
                        <th>Instructor</th>
                        <th>Relación tipo</th>
                        <th>Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr key={`related-row-${row.id}`} onDoubleClick={() => openDetailModal(row)}>
                          <td>{String(row.IDUnico ?? row.idunico ?? row.id_unico ?? '-')}</td>
                          <td>{String(row.curso_nombre || '-')}</td>
                          <td>{String(row.curso_instructor || '-')}</td>
                          <td>{String(row.relacion_tipo || '-')}</td>
                          <td>
                            <div className="row-actions">
                              {String(row.curso_estado || '').trim() === COURSE_STATUS_IN_PROGRESS ? (
                                <button type="button" className="secondary action-button" onClick={() => setCoursePendingValidation(row)}>
                                  Pasar a pendiente de validación
                                </button>
                              ) : null}
                              <button type="button" className="secondary" onClick={() => openDetailModal(row)}>
                                Detalles
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : cursosSubView === 'traducciones' ? (
        <section className="translations-view">
          <div className="translation-presets">
            <button
              type="button"
              className={`secondary ${translationPreset === 'parents' ? 'active-preset' : ''}`}
              onClick={() => setTranslationPreset('parents')}
            >
              TODOS
            </button>
            <button
              type="button"
              className={`secondary ${translationPreset === 'es_only' ? 'active-preset' : ''}`}
              onClick={() => setTranslationPreset('es_only')}
            >
              Solo en español
            </button>
            <button
              type="button"
              className={`secondary ${translationPreset === 'all_languages' ? 'active-preset' : ''}`}
              onClick={() => setTranslationPreset('all_languages')}
            >
              Cursos en todos los idiomas
            </button>
            <div className="missing-language-filter">
              <button
                type="button"
                className={`secondary ${translationPreset === 'only_language' ? 'active-preset' : ''}`}
                onClick={() => setTranslationPreset('only_language')}
              >
                Solo en
              </button>
              <select
                value={pendingLanguage}
                onChange={(event) => {
                  setPendingLanguage(event.target.value);
                  setTranslationPreset('only_language');
                }}
                aria-label="Seleccionar idioma"
              >
                {translationAvailableLanguages.map((language) => (
                  <option key={`curso-language-${language}`} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {translationPreset === 'parents' ? (
            <div className="status-board-actions">
              <button
                type="button"
                className="secondary"
                disabled={selectedTranslationParentIds.length === 0}
                onClick={() => {
                  const selectedRows = translationRows
                    .filter((item) => selectedTranslationParentIds.includes(item.id))
                    .map((item) => item.row);
                  openCreateTranslationModal(selectedRows, true);
                }}
              >
                CREAR TRADUCCIÓN ({selectedTranslationParentIds.length})
              </button>
            </div>
          ) : null}

          {translationRows.length === 0 ? (
            <p className="status">No hay cursos que coincidan con el filtro seleccionado.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {translationPreset === 'parents' ? <th>Sel.</th> : null}
                    <th>IDUnico</th>
                    <th>Curso nombre</th>
                    <th>Idioma</th>
                    <th>Idiomas del grupo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {translationRows.map((item) => (
                    <tr key={`curso-translation-${item.id}`}>
                      {translationPreset === 'parents' ? (
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedTranslationParentIds.includes(item.id)}
                            onChange={() => toggleTranslationParentSelection(item.id)}
                          />
                        </td>
                      ) : null}
                      <td>{item.uniqueId}</td>
                      <td>{item.cursoNombre}</td>
                      <td>{item.idioma}</td>
                      <td>{item.languageSummary.join(', ') || '-'}</td>
                      <td>
                        <div className="row-actions">
                          {translationPreset === 'parents' ? (
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => openCreateTranslationModal([item.row], false)}
                            >
                              CREAR TRADUCCIÓN
                            </button>
                          ) : null}
                          <button type="button" className="secondary" onClick={() => openDetailModal(item.row)}>
                            Ver detalle
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
      ) : cursosSubView === 'validacion' ? (
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
              disabled={selectedValidationCourseIds.length === 0 || !canValidateCourses}
              onClick={moveSelectedValidationCoursesToPendingPublish}
            >
              Validar selección ({selectedValidationCourseIds.length})
            </button>
          </div>

          {!canValidateCourses ? <p className="status">Solo los usuarios con <strong>validador: true</strong> pueden mover cursos a "Pendiente de publicar".</p> : null}

          {pendingValidationRows.length === 0 ? (
            <p className="status">No hay cursos en estado &quot;Pendiente de validación&quot; para los filtros actuales.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Sel.</th>
                    {compactColumns.map((columnKey) => {
                      const column = columns.find((item) => item.key === columnKey);
                      return <th key={`validation-head-${column.key}`}>{column.label}</th>;
                    })}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingValidationRows.map((row) => (
                    <tr key={`validation-row-${row.id}`} onDoubleClick={() => openDetailModal(row)}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedValidationCourseIds.includes(row.id)}
                          onChange={() =>
                            setSelectedValidationCourseIds((previous) =>
                              previous.includes(row.id) ? previous.filter((id) => id !== row.id) : [...previous, row.id],
                            )
                          }
                        />
                      </td>
                      {compactColumns.map((columnKey) => {
                        const value = row[columnKey];

                        return (
                          <td key={`validation-${row.id}-${columnKey}`}>
                            {columnKey === 'curso_url' && isUrl(value) ? (
                              <a className="table-link" href={value} target="_blank" rel="noreferrer">LINK</a>
                            ) : (
                              String(value || '-')
                            )}
                          </td>
                        );
                      })}
                      <td>
                        <div className="row-actions">
                          <button type="button" className="secondary action-button" onClick={() => openDetailModal(row)}>
                            Detalles
                          </button>
                          <button
                            type="button"
                            className="publish-button action-button"
                            disabled={!canValidateCourses}
                            onClick={() => moveCourseToPendingPublish(row)}
                          >
                            VALIDAR CURSO
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
      ) : (
        <section className="publish-view">
          <div className="status-board-actions">
            <button type="button" className="secondary" disabled={moveHistory.length === 0} onClick={handleUndo}>
              ← DESHACER
            </button>
            <button type="button" className="secondary" disabled={redoHistory.length === 0} onClick={handleRedo}>
              REHACER →
            </button>
          </div>

          {pendingPublishRows.length === 0 ? (
            <p className="status">No hay cursos en estado &quot;Pendiente de publicar&quot; para los filtros actuales.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {compactColumns.map((columnKey) => {
                      const column = columns.find((item) => item.key === columnKey);
                      return <th key={`publish-head-${column.key}`}>{column.label}</th>;
                    })}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPublishRows.map((row) => (
                    <tr key={`publish-row-${row.id}`} onDoubleClick={() => openDetailModal(row)}>
                      {compactColumns.map((columnKey) => {
                        const value = row[columnKey];

                        return (
                          <td key={`publish-${row.id}-${columnKey}`}>
                            {columnKey === 'curso_url' && isUrl(value) ? (
                              <a className="table-link" href={value} target="_blank" rel="noreferrer">
                                LINK
                              </a>
                            ) : (
                              String(value || '-')
                            )}
                          </td>
                        );
                      })}
                      <td>
                        <div className="row-actions">
                          <button type="button" className="secondary action-button" onClick={() => openDetailModal(row)}>
                            Detalles
                          </button>
                          <button type="button" className="publish-button action-button" onClick={() => publishCourse(row)}>
                            PUBLICAR
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

      {scormsModalRows.length > 0 ? (
        <div className="modal-overlay" role="presentation">
          <section className="modal-content" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>SCORMs asociados</h3>
              </div>
              <button type="button" className="secondary" onClick={() => setScormsModalRows([])}>
                Cerrar
              </button>
            </div>

            {activeScormMatches.length === 0 ? (
              <p className="status">No se encontraron SCORMs master para las referencias detectadas en contenido.</p>
            ) : (
              <div className="scorms-accordion-list">
                {activeScormMatches.map((scorm) => {
                  const detailEntries = Object.entries(scorm).filter(
                    ([key]) => !['id', 'created_at', 'scorm_code', 'scorm_name', 'scorm_responsable', 'scorm_url'].includes(key),
                  );

                  return (
                    <details key={scorm.id} className="scorms-accordion-item">
                      <summary>
                        <span className="scorm-summary-grid">
                          <strong>{String(scorm.scorm_code || '-')}</strong>
                          <span>{String(scorm.scorm_name || '-')}</span>
                          <span>{String(scorm.scorm_responsable || '-')}</span>
                          {isUrl(scorm.scorm_url) ? (
                            <a href={scorm.scorm_url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                              Link RISE
                            </a>
                          ) : (
                            <span>{String(scorm.scorm_url || '-')}</span>
                          )}
                        </span>
                      </summary>

                      <div className="details-grid scorm-modal-details-grid">
                        {detailEntries.map(([key, value]) => (
                          <div key={`${scorm.id}-${key}`} className="readonly-field">
                            <span>{formatFieldLabel(key)}</span>
                            <p>{String(value || '-')}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {createPlanModalOpen ? (
        <div className="modal-overlay" role="presentation">
          <section className="modal-content modal-content-large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Crear Plan de aprendizaje</h3>
                <p>Selecciona cursos existentes para generar sus filas vinculadas al PA.</p>
              </div>
              <button type="button" className="secondary" onClick={resetCreatePlanState} disabled={createPlanSubmitting}>
                Cerrar
              </button>
            </div>

            <div className="details-grid">
              <label>
                <span>PA Nombre</span>
                <input
                  type="text"
                  value={createPlanDraft.pa_nombre}
                  onChange={(event) =>
                    setCreatePlanDraft((previous) => ({
                      ...previous,
                      pa_nombre: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>PA Código</span>
                <input
                  type="text"
                  value={createPlanDraft.pa_codigo}
                  onChange={(event) =>
                    setCreatePlanDraft((previous) => ({
                      ...previous,
                      pa_codigo: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>PA URL</span>
                <input
                  type="text"
                  value={createPlanDraft.pa_url}
                  onChange={(event) =>
                    setCreatePlanDraft((previous) => ({
                      ...previous,
                      pa_url: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Acrónimo PA (para código curso)</span>
                <input
                  type="text"
                  value={createPlanDraft.pa_acronimo}
                  onChange={(event) =>
                    setCreatePlanDraft((previous) => ({
                      ...previous,
                      pa_acronimo: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <section className="card-soft">
              <h4>Seleccionar cursos existentes</h4>
              <p className="status">Solo se muestran cursos que todavía no forman parte de un plan de aprendizaje.</p>
              <input
                type="text"
                placeholder="Buscar curso por código, nombre o código individual..."
                value={planCourseSearchText}
                onChange={(event) => setPlanCourseSearchText(event.target.value)}
              />

              <div className="table-wrapper" style={{ marginTop: '0.6rem' }}>
                <table className="compact-rows">
                  <thead>
                    <tr>
                      <th>Sel.</th>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Código individual</th>
                      <th>Tipología</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlanCourses.slice(0, 80).map((row) => (
                      <tr key={`create-plan-course-${row.id}`}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedPlanCourseIds.includes(row.id)}
                            onChange={() => toggleSelectedPlanCourse(row.id)}
                          />
                        </td>
                        <td>{String(row.curso_codigo || '-')}</td>
                        <td>{String(row.curso_nombre || '-')}</td>
                        <td>{String(row.codigo_individual || '-')}</td>
                        <td>{String(row.tipologia || '-')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="status">
                Seleccionados: {selectedPlanCourseIds.length} · Se crearán nuevas filas con datos del PA y código de curso prefijado con el acrónimo.
              </p>
            </section>

            <footer className="modal-footer">
              <button type="button" onClick={submitCreatePlan} disabled={createPlanSubmitting}>
                {createPlanSubmitting ? 'Creando PA...' : 'Crear Plan de aprendizaje'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {createModalOpen ? (
        <div className="modal-overlay" role="presentation">
          <section className="modal-content modal-content-large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Crear Curso</h3>
                <p>Rellena los datos y relaciona SCORMs para guardar en la columna contenido.</p>
              </div>
              <button type="button" className="secondary" onClick={resetCreateCursoState} disabled={createSubmitting}>
                Cerrar
              </button>
            </div>

            <div className="details-grid">
              <label>
                <span>IDUnico</span>
                <input type="text" value={getNextAvailableUniqueId()} disabled />
              </label>
              <label>
                <span>URL curso</span>
                <input type="text" value={String(createDraft.curso_url || '')} disabled />
              </label>
              <label>
                <span>Link inscripción</span>
                <input type="text" value={String(createDraft.link_inscripcion || '')} disabled />
              </label>

              {Object.keys(createDraft)
                .filter((key) => !['curso_observaciones', 'curso_url', 'link_inscripcion'].includes(key))
                .map((key) => {
                  const managedFieldConfig = createCourseManagedSelectorFields.find((field) => field.key === key);

                  if (managedFieldConfig) {
                    const isCustomMode = createManagedFieldMode[key] === true;
                    const options = createManagedFieldOptions[key] || [];

                    return (
                      <label key={`create-curso-${key}`}>
                        <span>{managedFieldConfig.label}</span>
                        {isCustomMode ? (
                          <input
                            type="text"
                            value={String(createDraft[key] || '')}
                            onChange={(event) =>
                              setCreateDraft((previous) => ({
                                ...previous,
                                [key]: event.target.value,
                              }))
                            }
                            placeholder={`Nuevo valor para ${managedFieldConfig.label}`}
                          />
                        ) : (
                          <select
                            value={String(createDraft[key] || '')}
                            onChange={(event) =>
                              setCreateDraft((previous) => ({
                                ...previous,
                                [key]: event.target.value,
                              }))
                            }
                          >
                            <option value="">Selecciona...</option>
                            {options.map((option) => (
                              <option key={`create-option-${key}-${option}`} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                        {canCreateManagedValues ? (
                          <button
                            type="button"
                            className="secondary"
                            style={{ marginTop: '0.35rem' }}
                            onClick={() =>
                              setCreateManagedFieldMode((previous) => ({
                                ...previous,
                                [key]: !previous[key],
                              }))
                            }
                          >
                            {isCustomMode ? 'Usar lista BDD' : 'Crear nuevo valor'}
                          </button>
                        ) : null}
                      </label>
                    );
                  }

                  return (
                    <label key={`create-curso-${key}`}>
                      <span>{formatFieldLabel(key)}</span>
                      {key === 'observaciones' ? (
                        <textarea
                          className="field-observaciones-textarea"
                          value={String(createDraft[key] || '')}
                          onChange={(event) =>
                            setCreateDraft((previous) => ({
                              ...previous,
                              [key]: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(createDraft[key] || '')}
                          onChange={(event) =>
                            setCreateDraft((previous) => ({
                              ...previous,
                              [key]: event.target.value,
                            }))
                          }
                        />
                      )}
                    </label>
                  );
                })}
            </div>

            <section className="card-soft">
              <h4>Relacionar SCORMs</h4>
              <p className="status">Buscador por código, nombre, responsable y categoría.</p>
              <input
                type="text"
                placeholder="Buscar SCORM..."
                value={scormSearchText}
                onChange={(event) => setScormSearchText(event.target.value)}
              />

              <div className="table-wrapper" style={{ marginTop: '0.6rem' }}>
                <table className="compact-rows">
                  <thead>
                    <tr>
                      <th>Sel.</th>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Responsable</th>
                      <th>Categoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMasterScormRows.slice(0, 40).map((row) => (
                      <tr key={`create-scorm-${row.id}`}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedScormIds.includes(row.id)}
                            onChange={() => toggleSelectedScorm(row.id)}
                          />
                        </td>
                        <td>{getScormReferenceLabel(row)}</td>
                        <td>{String(row.scorm_name || '-')}</td>
                        <td>{String(row.scorm_responsable || '-')}</td>
                        <td>{String(row.scorm_categoria || '-')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="status">
                Seleccionados: {selectedScormIds.length} · Se guardarán en <strong>contenido</strong> como referencias `IDIOMA-SCR####`.
              </p>
            </section>

            <footer className="modal-footer">
              <button type="button" onClick={submitCreateCurso} disabled={createSubmitting}>
                {createSubmitting ? 'Creando...' : 'Crear Curso'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}


      {relatedCreateModalOpen ? (
        <div className="modal-overlay" role="presentation">
          <section className="modal-content modal-content-large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Crear curso relacionado</h3>
                <p>El nuevo curso heredará el IDUnico del padre y permite editar los datos heredados.</p>
              </div>
              <button type="button" className="secondary" onClick={resetRelatedCreateState} disabled={relatedCreateSubmitting}>
                Cerrar
              </button>
            </div>

            <div className="details-grid" style={{ marginBottom: '0.8rem' }}>
              <label>
                <span>IDUnico (padre)</span>
                <input type="text" value={relatedCreateUniqueId} disabled />
              </label>
              <label>
                <span>Tipo de relación</span>
                <input
                  type="text"
                  value={relatedRelationType}
                  onChange={(event) => setRelatedRelationType(event.target.value)}
                />
              </label>
            </div>

            <div className="details-grid">
              {columns.map((column) => (
                <label key={`create-related-${column.key}`}>
                  <span>{column.label}</span>
                  {column.key === 'curso_observaciones' ? (
                    <textarea
                      className="field-observaciones-textarea"
                      value={String(relatedCreateDraft[column.key] || '')}
                      onChange={(event) =>
                        setRelatedCreateDraft((previous) => ({
                          ...previous,
                          [column.key]: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(relatedCreateDraft[column.key] || '')}
                      onChange={(event) =>
                        setRelatedCreateDraft((previous) => ({
                          ...previous,
                          [column.key]: event.target.value,
                        }))
                      }
                    />
                  )}
                </label>
              ))}
            </div>

            <footer className="modal-footer">
              <button type="button" onClick={submitCreateRelatedCurso} disabled={relatedCreateSubmitting}>
                {relatedCreateSubmitting ? 'Creando...' : 'Guardar curso relacionado'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {translationCreateModalOpen ? (
        <div className="modal-overlay" role="presentation">
          <section className="modal-content modal-content-large" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{translationCreateBulkMode ? 'Crear traducciones múltiples' : 'Crear traducción'}</h3>
                <p>Se conserva el IDUnico del curso padre y se asigna tipo de relación Traducción.</p>
              </div>
              <button type="button" className="secondary" onClick={resetCreateTranslationState} disabled={translationCreateSubmitting}>
                Cerrar
              </button>
            </div>

            <div className="details-grid" style={{ marginBottom: '0.8rem' }}>
              <label className="field-highlight">
                <span>Idioma (obligatorio)</span>
                <select
                  value={translationCreateLanguage}
                  onChange={(event) => setTranslationCreateLanguage(event.target.value)}
                  disabled={translationCreateSubmitting}
                >
                  {translationAvailableLanguages.map((language) => (
                    <option key={`translation-create-lang-${language}`} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Tipo de relación</span>
                <input type="text" value="Traducción" disabled />
              </label>
            </div>

            {translationCreateBulkMode ? (
              <div className="table-wrapper">
                <table className="compact-rows">
                  <thead>
                    <tr>
                      <th>IDUnico</th>
                      <th>Nombre original</th>
                      <th>Nombre traducción (obligatorio)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {translationCreateRows.map((row, index) => (
                      <tr key={`translation-create-bulk-${row.sourceId}-${row.uniqueId}`}>
                        <td>{row.uniqueId || '-'}</td>
                        <td>{String(row.draft.curso_nombre || '-')}</td>
                        <td>
                          <input
                            className="field-highlight-input"
                            type="text"
                            value={row.name}
                            onChange={(event) =>
                              setTranslationCreateRows((previous) =>
                                previous.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        name: event.target.value,
                                      }
                                    : item,
                                ),
                              )
                            }
                            disabled={translationCreateSubmitting}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="details-grid">
                {columns.map((column) => {
                  const row = translationCreateRows[0] || {};
                  const currentValue = column.key === 'curso_nombre' ? row.name : String(row.draft?.[column.key] || '');

                  if (column.key === 'curso_idioma') {
                    return null;
                  }

                  return (
                    <label key={`translation-single-${column.key}`} className={column.key === 'curso_nombre' ? 'field-highlight' : ''}>
                      <span>{column.label}{column.key === 'curso_nombre' ? ' (obligatorio)' : ''}</span>
                      {column.key === 'curso_observaciones' ? (
                        <textarea
                          className="field-observaciones-textarea"
                          value={currentValue}
                          onChange={(event) =>
                            setTranslationCreateRows((previous) =>
                              previous.map((item, index) =>
                                index === 0
                                  ? {
                                      ...item,
                                      draft: {
                                        ...item.draft,
                                        [column.key]: event.target.value,
                                      },
                                    }
                                  : item,
                              ),
                            )
                          }
                          disabled={translationCreateSubmitting}
                        />
                      ) : (
                        <input
                          className={column.key === 'curso_nombre' ? 'field-highlight-input' : ''}
                          type="text"
                          value={currentValue}
                          onChange={(event) =>
                            setTranslationCreateRows((previous) =>
                              previous.map((item, index) =>
                                index === 0
                                  ? column.key === 'curso_nombre'
                                    ? {
                                        ...item,
                                        name: event.target.value,
                                      }
                                    : {
                                        ...item,
                                        draft: {
                                          ...item.draft,
                                          [column.key]: event.target.value,
                                        },
                                      }
                                  : item,
                              ),
                            )
                          }
                          disabled={translationCreateSubmitting}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            <footer className="modal-footer">
              <button type="button" onClick={submitCreateTranslation} disabled={translationCreateSubmitting}>
                {translationCreateSubmitting ? 'Creando...' : 'Guardar traducción'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {paDetailsModalRow ? (
        <div className="modal-overlay" role="presentation" onClick={() => setPaDetailsModalRow(null)}>
          <section className="modal-content" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Planes de aprendizaje relacionados</h3>
                <p>{paDetailsModalRow.cursoNombre} · IDUnico: {paDetailsModalRow.uniqueId || '-'}</p>
              </div>
              <button type="button" className="secondary" onClick={() => setPaDetailsModalRow(null)}>
                Cerrar
              </button>
            </div>

            {paDetailsModalRow.paGroups.length === 0 ? (
              <p className="status">No hay planes de aprendizaje relacionados para este curso.</p>
            ) : (
              <div className="table-wrapper">
                <table className="compact-rows">
                  <thead>
                    <tr>
                      <th>PA Código</th>
                      <th>PA Nombre</th>
                      <th>PA URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paDetailsModalRow.paGroups.map((group) => (
                      <tr key={`pa-group-${group.key}`}>
                        <td>{group.paCodigo}</td>
                        <td>{group.paNombre}</td>
                        <td>
                          {isUrl(group.paUrl) ? (
                            <a className="table-link" href={group.paUrl} target="_blank" rel="noreferrer">
                              LINK
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}


      {detailModalRow && detailDraft ? (
        <div className="modal-overlay" role="presentation">
          <section className="modal-content" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Detalle del curso</h3>
              </div>
              <div className="modal-header-actions">
                <button
                  type="button"
                  className="secondary action-button delete-button"
                  onClick={() => deleteCourse(detailDraft)}
                  disabled={detailSaving}
                >
                  Eliminar curso
                </button>
                <button type="button" className="secondary" onClick={closeDetailModal} disabled={detailSaving}>
                  Cerrar
                </button>
              </div>
            </div>

            <div className="details-grid">
              {detailModalColumns.filter((column) => column.key !== 'curso_observaciones').map((column) => (
                <label key={`detail-modal-${column.key}`}>
                  <span>{column.label}</span>
                  {column.key === 'curso_observaciones' ? (
                    <textarea
                      className="field-observaciones-textarea"
                      value={String(detailDraft[column.key] || '')}
                      onChange={(event) =>
                        setDetailDraft((previous) => ({
                          ...previous,
                          [column.key]: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(detailDraft[column.key] || '')}
                      onChange={(event) =>
                        setDetailDraft((previous) => ({
                          ...previous,
                          [column.key]: event.target.value,
                        }))
                      }
                    />
                  )}
                </label>
              ))}
            </div>

            <section className="card-soft" style={{ marginTop: '0.8rem' }}>
              <h4>Asociar SCORMs al curso</h4>
              <input
                type="text"
                placeholder="Buscar SCORM..."
                value={detailScormSearchText}
                onChange={(event) => setDetailScormSearchText(event.target.value)}
              />
              <div className="table-wrapper" style={{ marginTop: '0.6rem' }}>
                <table className="compact-rows">
                  <thead>
                    <tr>
                      <th>Sel.</th>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDetailMasterScormRows.slice(0, 40).map((row) => (
                      <tr key={`detail-scorm-${row.id}`}>
                        <td>
                          <input
                            type="checkbox"
                            checked={detailSelectedScormIds.includes(row.id)}
                            onChange={() => toggleDetailSelectedScorm(row.id)}
                          />
                        </td>
                        <td>{getScormReferenceLabel(row)}</td>
                        <td>{String(row.scorm_name || '-')}</td>
                        <td>{String(row.scorm_responsable || '-')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="status">Seleccionados: {detailSelectedScormIds.length} · Se guardan en contenido al guardar cambios.</p>
            </section>

            <footer className="modal-footer">
              <button type="button" onClick={saveDetailModal} disabled={detailSaving}>
                {detailSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
