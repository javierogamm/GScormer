'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const columns = [
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

const compactColumns = ['curso_codigo', 'curso_nombre', 'tipologia', 'materia', 'pa_nombre', 'curso_instructor', 'curso_url'];
const detailColumns = columns.filter((column) => !compactColumns.includes(column.key));

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

export default function ScormsCursosTable({ onBackToScorms }) {
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
  const [scormsModalRow, setScormsModalRow] = useState(null);
  const [detailModalRow, setDetailModalRow] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createDraft, setCreateDraft] = useState({
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

  const filteredRows = useMemo(() => {
    const activeFilterEntries = Object.entries(filters).filter(([, values]) => values.length > 0);

    if (activeFilterEntries.length === 0) {
      return rows;
    }

    return rows.filter((row) => {
      return activeFilterEntries.every(([columnKey, values]) => {
        const rowValue = String(row[columnKey] || '').toLowerCase();
        return values.every((value) => rowValue.includes(value.toLowerCase()));
      });
    });
  }, [rows, filters]);

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

  const activeScormMatches = useMemo(() => {
    if (!scormsModalRow) {
      return [];
    }

    const references = extractScormReferencesFromContenido(scormsModalRow.contenido);
    const dedupedMatches = new Map();

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

    return Array.from(dedupedMatches.values());
  }, [scormsByCode, scormsModalRow]);

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

  const resetCreateCursoState = () => {
    setCreateModalOpen(false);
    setCreateSubmitting(false);
    setScormSearchText('');
    setSelectedScormIds([]);
    setCreateDraft({
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

  const individualScormGroups = useMemo(() => {
    const groupedByScorm = filteredRows.reduce((acc, row) => {
      const references = extractScormReferencesFromContenido(row.contenido);
      const uniqueScormCodes = Array.from(new Set(references.map((reference) => String(reference.code || '').trim().toUpperCase()).filter(Boolean)));
      const fallbackCodes = uniqueScormCodes.length > 0 ? uniqueScormCodes : ['SIN_SCORM'];

      fallbackCodes.forEach((scormCode) => {
        if (!acc[scormCode]) {
          acc[scormCode] = [];
        }

        acc[scormCode].push(row);
      });

      return acc;
    }, {});

    return Object.entries(groupedByScorm)
      .map(([scormCode, scormRows]) => {
        const individualGroups = Object.entries(
          scormRows.reduce((acc, row) => {
            const key = String(row.codigo_individual || '').trim() || 'SIN_CODIGO_INDIVIDUAL';

            if (!acc[key]) {
              acc[key] = [];
            }

            acc[key].push(row);
            return acc;
          }, {}),
        )
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

        const scormName =
          scormCode === 'SIN_SCORM'
            ? 'Sin SCORM referenciado'
            : String((scormsByCode[scormCode] || [])[0]?.scorm_name || (scormsByCode[scormCode] || [])[0]?.scorm_nombre || '-');

        return {
          scormCode,
          scormLabel: scormCode === 'SIN_SCORM' ? 'Sin SCORM referenciado' : scormCode,
          scormName,
          individualGroups,
        };
      })
      .sort((left, right) => left.scormLabel.localeCompare(right.scormLabel, 'es', { sensitivity: 'base' }));
  }, [filteredRows, scormsByCode]);

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
          <h2>SCORMs Cursos · {cursosSubView === 'general' ? 'Vista general' : 'Cursos individuales'}</h2>
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
          <button type="button" onClick={() => setCreateModalOpen(true)}>
            Crear Curso
          </button>
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
          {columns.map((column) => {
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
                        <button type="button" className="secondary" onClick={() => setScormsModalRow(row)}>
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
                        <button className="secondary expand-row-button" onClick={() => toggleExpandRow(row.id)}>
                          {isExpanded ? 'Colapsar' : 'Expandir'}
                        </button>
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
      ) : (
        <section className="individuales-view">
          {individualScormGroups.length === 0 ? <p className="status">No hay cursos individuales para los filtros aplicados.</p> : null}
          <div className="scorms-accordion-list">
            {individualScormGroups.map((scormGroup) => (
              <details key={scormGroup.scormCode} className="scorms-accordion-item">
                <summary>
                  <span className="individual-summary-grid">
                    <strong>SCORMS · {scormGroup.scormLabel}</strong>
                    <span>{scormGroup.scormName}</span>
                    <span>{scormGroup.individualGroups.length} cursos individuales</span>
                  </span>
                </summary>
                <div className="scorms-accordion-list">
                  {scormGroup.individualGroups.map((group) => (
                    <details key={`${scormGroup.scormCode}-${group.codeKey}`} className="scorms-accordion-item individual-course-group">
                      <summary>
                        <span className="individual-summary-grid">
                          <strong>{group.codeLabel}</strong>
                          <span>{group.cursoNombre}</span>
                          <span>{group.materia}</span>
                        </span>
                      </summary>
                      <div className="table-wrapper individual-inner-table-wrapper">
                        <table className="cursos-table compact-rows individual-inner-table">
                          <thead>
                            <tr>
                              <th>Curso código</th>
                              <th>Curso nombre</th>
                              <th>Tipología</th>
                              <th>Detalle</th>
                              <th>SCORMs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.rows.map((row) => (
                              <tr key={`individual-row-${row.id}`}>
                                <td>{String(row.curso_codigo || '-')}</td>
                                <td>{String(row.curso_nombre || '-')}</td>
                                <td>{String(row.tipologia || '-')}</td>
                                <td>
                                  <button type="button" className="secondary" onClick={() => setDetailModalRow(row)}>
                                    Detalles
                                  </button>
                                </td>
                                <td>
                                  <button type="button" className="secondary" onClick={() => setScormsModalRow(row)}>
                                    Scorms
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {scormsModalRow ? (
        <div className="modal-overlay" role="presentation" onClick={() => setScormsModalRow(null)}>
          <section className="modal-content" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>SCORMs asociados</h3>
              </div>
              <button type="button" className="secondary" onClick={() => setScormsModalRow(null)}>
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

      {detailModalRow ? (
        <div className="modal-overlay" role="presentation" onClick={() => setDetailModalRow(null)}>
          <section className="modal-content" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Detalle del curso</h3>
              </div>
              <button type="button" className="secondary" onClick={() => setDetailModalRow(null)}>
                Cerrar
              </button>
            </div>

            <div className="details-grid">
              {columns.map((column) => (
                <div key={`detail-modal-${column.key}`} className="readonly-field">
                  <span>{column.label}</span>
                  <p>{String(detailModalRow[column.key] || '-')}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
