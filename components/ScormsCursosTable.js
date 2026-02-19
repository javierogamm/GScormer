'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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
  { key: 'curso_instructor', label: 'Curso instructor' },
  { key: 'curso_inscripcion', label: 'Curso inscripción' },
  { key: 'observaciones', label: 'Observaciones' },
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
const detailColumns = columns.filter((column) => column.key === 'curso_estado' || !compactColumns.includes(column.key));
const COURSE_STATUS_PENDING = 'Pendiente de publicar';
const COURSE_STATUS_PUBLISHED = 'Publicado';
const COURSE_STATUS_IN_PROGRESS = 'En proceso';

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

export default function ScormsCursosTable({ onBackToScorms, userSession }) {
  const [cursosSubView, setCursosSubView] = useState('general');
  const [rows, setRows] = useState([]);
  const [masterRows, setMasterRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [filterInputs, setFilterInputs] = useState({});
  const [filters, setFilters] = useState({});
  const [expandedRows, setExpandedRows] = useState([]);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [scormsModalRows, setScormsModalRows] = useState([]);
  const [detailModalRow, setDetailModalRow] = useState(null);
  const [detailDraft, setDetailDraft] = useState(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false);
  const [createPlanSubmitting, setCreatePlanSubmitting] = useState(false);
  const [createDraft, setCreateDraft] = useState({
    curso_estado: COURSE_STATUS_IN_PROGRESS,
    curso_nombre: '',
    curso_codigo: '',
    tipologia: '',
    inscripcion: '',
    materia: '',
    curso_instructor: '',
    curso_url: '',
    curso_descripcion: '',
    link_inscripcion: '',
    observaciones: '',
    codigo_individual: '',
  });
  const [scormSearchText, setScormSearchText] = useState('');
  const [selectedScormIds, setSelectedScormIds] = useState([]);
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
  const scopedInstructorAgents = userSession?.agentFilters?.instructores || [];

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

  const prioritizedFilterColumns = useMemo(() => {
    const highlightedKeys = ['curso_codigo', 'curso_nombre'];
    const highlighted = highlightedKeys
      .map((key) => columns.find((column) => column.key === key))
      .filter(Boolean);
    const rest = columns.filter((column) => !highlightedKeys.includes(column.key));
    return [...highlighted, { key: '__scorms__', label: 'SCORMS' }, ...rest];
  }, []);

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
    setCreateDraft({
      curso_estado: COURSE_STATUS_IN_PROGRESS,
      curso_nombre: '',
      curso_codigo: '',
      tipologia: '',
      inscripcion: '',
      materia: '',
      curso_instructor: '',
      curso_url: '',
      curso_descripcion: '',
      link_inscripcion: '',
      observaciones: '',
      codigo_individual: '',
    });
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

  const individualCourseGroups = useMemo(() => {
    const grouped = filteredRows.reduce((acc, row) => {
      const key = String(row.codigo_individual || '').trim() || 'SIN_CODIGO_INDIVIDUAL';

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(row);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([codeKey, groupRows]) => {
        const firstRow = groupRows[0] || {};
        return {
          codeKey,
          codeLabel: codeKey === 'SIN_CODIGO_INDIVIDUAL' ? 'Sin código individual' : codeKey,
          materia: String(firstRow.materia || '-'),
          cursoNombre: String(firstRow.curso_nombre || '-'),
          rows: groupRows,
        };
      })
      .sort((left, right) => left.codeLabel.localeCompare(right.codeLabel, 'es', { sensitivity: 'base' }));
  }, [filteredRows]);

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

  const openDetailModal = (row) => {
    setDetailModalRow(row);
    setDetailDraft({ ...row });
  };

  const closeDetailModal = () => {
    if (detailSaving) {
      return;
    }

    setDetailModalRow(null);
    setDetailDraft(null);
  };

  const saveDetailModal = async () => {
    if (!detailModalRow || !detailDraft) {
      return;
    }

    const payload = columns.reduce((acc, column) => {
      acc[column.key] = detailDraft[column.key] ?? null;
      return acc;
    }, {});

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

  const pendingPublishRows = useMemo(
    () => filteredRows.filter((row) => String(row.curso_estado || '').trim() === COURSE_STATUS_PENDING),
    [filteredRows],
  );

  const publishCoursesCount = pendingPublishRows.length;

  const changeCourseStatus = async (row, nextStatus, successMessage) => {
    const currentStatus = String(row.curso_estado || '').trim() || COURSE_STATUS_IN_PROGRESS;

    if (currentStatus === nextStatus) {
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

  const setCoursePendingPublication = async (row) => {
    await changeCourseStatus(
      row,
      COURSE_STATUS_PENDING,
      `Curso movido a pendiente de publicar: ${row.curso_nombre || row.curso_codigo || `ID ${row.id}`}`,
    );
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
      contenido: contenidoScorm,
    };

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

  const toggleExpandRow = (rowId) => {
    setExpandedRows((previous) =>
      previous.includes(rowId) ? previous.filter((id) => id !== rowId) : [...previous, rowId],
    );
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

  return (
    <section className="card card-wide">
      <div className="card-header">
        <div>
          <h2>
            SCORMs Cursos ·{' '}
            {cursosSubView === 'general'
              ? 'Vista general'
              : cursosSubView === 'individuales'
                ? 'Cursos individuales'
                : cursosSubView === 'planes'
                  ? 'Planes de aprendizaje'
                : 'Publicación pendiente'}
          </h2>
          <p className="status">Vista conectada a la tabla `scorms_cursos`.</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className={cursosSubView === 'general' ? '' : 'secondary'}
            onClick={() => setCursosSubView('general')}
          >
            Vista general
          </button>
          <button
            type="button"
            className={cursosSubView === 'individuales' ? '' : 'secondary'}
            onClick={() => setCursosSubView('individuales')}
          >
            Cursos individuales
          </button>
          <button type="button" className={cursosSubView === 'planes' ? '' : 'secondary'} onClick={() => setCursosSubView('planes')}>
            Planes de aprendizaje
          </button>
          <button
            type="button"
            className={`${cursosSubView === 'publicacion' ? '' : 'secondary'} ${publishCoursesCount > 0 ? 'pending-highlight' : ''}`}
            onClick={() => setCursosSubView('publicacion')}
          >
            Publicación pendiente
            <span className="preset-kpi-badge" title="Cursos pendientes de publicar">
              {publishCoursesCount}
            </span>
          </button>
          <button
            type="button"
            className={`secondary ${myCoursesOnly ? 'active-preset' : ''}`}
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
          <button type="button" onClick={() => setCreateModalOpen(true)}>
            Crear Curso
          </button>
          {cursosSubView === 'planes' ? (
            <button type="button" onClick={() => setCreatePlanModalOpen(true)}>
              Crear Plan de aprendizaje
            </button>
          ) : null}
          <button className="secondary" onClick={fetchData} disabled={loading}>
            {loading ? 'Cargando...' : 'Refrescar'}
          </button>
          {onBackToScorms ? (
            <button className="secondary" onClick={onBackToScorms}>
              ← Volver a SCORMs
            </button>
          ) : null}
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
        <>
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
                {filteredRows.map((row) => {
                  const isExpanded = expandedRows.includes(row.id);

                  return [
                    <tr key={`row-${row.id}`}>
                      <td>
                            <button type="button" className="secondary" onClick={() => setScormsModalRows([row])}>
                              Scorms
                            </button>
                      </td>
                      {compactColumns.map((columnKey) => {
                        const value = row[columnKey];
                        const hasActiveValueFilter = (filters[columnKey] || []).some(
                          (filterValue) => filterValue.toLowerCase() === String(value || '').trim().toLowerCase(),
                        );

                        return (
                          <td
                            key={`${row.id}-${columnKey}`}
                            className={`${columnKey === 'curso_nombre' ? 'col-curso_nombre' : ''} cell-selectable ${hasActiveValueFilter ? 'cell-selected' : ''}`}
                            onClick={() => toggleCellFilter(columnKey, value)}
                            title="Click para filtrar por este valor"
                          >
                            {columnKey === 'curso_url' && isUrl(value) ? (
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
                            <button type="button" className="secondary action-button" onClick={() => setCoursePendingPublication(row)}>
                              Pasar a pendiente de publicar
                            </button>
                          ) : null}
                          <button className="secondary expand-row-button" onClick={() => toggleExpandRow(row.id)}>
                            {isExpanded ? 'Colapsar' : 'Expandir'}
                          </button>
                        </div>
                      </td>
                    </tr>,
                    isExpanded ? (
                      <tr key={`detail-${row.id}`} className="expanded-detail-row">
                        <td colSpan={compactColumns.length + 2}>
                          <div className="details-grid">
                            {detailColumns.map((column) => (
                              <label key={`detail-${row.id}-${column.key}`}>
                                <span>{column.label}</span>
                                <input value={String(row[column.key] || '')} readOnly />
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null,
                  ];
                })}
              </tbody>
            </table>
          </div>
          {filteredRows.length === 0 ? <p className="status">No hay registros que coincidan con los filtros actuales.</p> : null}
        </>
      ) : cursosSubView === 'individuales' ? (
        <section className="individuales-view">
          {individualCourseGroups.length === 0 ? <p className="status">No hay cursos individuales para los filtros aplicados.</p> : null}
          <div className="scorms-accordion-list">
            {individualCourseGroups.map((group) => (
              <details key={group.codeKey} className="scorms-accordion-item individual-course-group">
                <summary>
                  <span className="individual-summary-actions">
                    <span className="individual-summary-grid">
                      <strong>{group.codeLabel}</strong>
                      <span>
                        {group.cursoNombre} ({group.rows.length})
                      </span>
                      <span>{group.materia}</span>
                    </span>
                    <button
                      type="button"
                      className="secondary"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setScormsModalRows(group.rows);
                      }}
                    >
                      Scorms
                    </button>
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
                        <tr key={`individual-row-${row.id}`}>
                          <td>{String(row.curso_codigo || '-')}</td>
                          <td>{String(row.curso_nombre || '-')}</td>
                          <td>{String(row.tipologia || '-')}</td>
                          <td>{String(row.curso_estado || '-')}</td>
                          <td>
                            <div className="row-actions">
                              {String(row.curso_estado || '').trim() === COURSE_STATUS_IN_PROGRESS ? (
                                <button type="button" className="secondary action-button" onClick={() => setCoursePendingPublication(row)}>
                                  Pasar a pendiente de publicar
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
                        <tr key={`plan-row-${group.key}-${row.id}`}>
                          <td>{String(row.curso_codigo || '-')}</td>
                          <td>{String(row.curso_nombre || '-')}</td>
                          <td>{String(row.tipologia || '-')}</td>
                          <td>{String(row.curso_estado || '-')}</td>
                          <td>
                            <div className="row-actions">
                              {String(row.curso_estado || '').trim() === COURSE_STATUS_IN_PROGRESS ? (
                                <button type="button" className="secondary action-button" onClick={() => setCoursePendingPublication(row)}>
                                  Pasar a pendiente de publicar
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
                    <tr key={`publish-row-${row.id}`}>
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
        <div className="modal-overlay" role="presentation" onClick={() => setScormsModalRows([])}>
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
        <div className="modal-overlay" role="presentation" onClick={resetCreatePlanState}>
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
        <div className="modal-overlay" role="presentation" onClick={resetCreateCursoState}>
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
              {Object.keys(createDraft).map((key) => (
                <label key={`create-curso-${key}`}>
                  <span>{formatFieldLabel(key)}</span>
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
                </label>
              ))}
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

      {detailModalRow && detailDraft ? (
        <div className="modal-overlay" role="presentation" onClick={closeDetailModal}>
          <section className="modal-content" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Detalle del curso</h3>
              </div>
              <button type="button" className="secondary" onClick={closeDetailModal} disabled={detailSaving}>
                Cerrar
              </button>
            </div>

            <div className="details-grid">
              {columns.map((column) => (
                <label key={`detail-modal-${column.key}`}>
                  <span>{column.label}</span>
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
                </label>
              ))}
            </div>

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
