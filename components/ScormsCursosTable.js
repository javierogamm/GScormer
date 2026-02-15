'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const columns = [
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

  return (
    <section className="card card-wide">
      <div className="card-header">
        <div>
          <h2>SCORMs Cursos · Vista general</h2>
          <p className="status">Vista conectada a la tabla `scorms_cursos`.</p>
        </div>
        <div className="header-actions">
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
        <div className="filter-panel-title filter-panel-title-interactive">
          <div className="filter-panel-title-main">
            <strong>Filtros</strong>
            {Object.values(filters).flat().length > 0 ? <span className="filter-counter">{Object.values(filters).flat().length}</span> : null}
          </div>
          <button type="button" className="secondary filter-collapse-button" onClick={() => setFiltersCollapsed((previous) => !previous)}>
            {filtersCollapsed ? 'Expandir' : 'Colapsar'}
          </button>
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

                    return (
                      <td key={`${row.id}-${columnKey}`} className={columnKey === 'curso_nombre' ? 'col-curso_nombre' : ''}>
                        {columnKey === 'curso_url' && isUrl(value) ? (
                          <a className="table-link" href={value} target="_blank" rel="noreferrer">
                            LINK
                          </a>
                        ) : isUrl(value) ? (
                          <a className="table-link" href={value} target="_blank" rel="noreferrer">
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
    </section>
  );
}
