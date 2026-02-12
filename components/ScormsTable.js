'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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
  { key: 'scorm_etiquetas', label: 'Etiquetas', editable: true },
];

const editableColumns = columns.filter((column) => column.editable).map((column) => column.key);

const STATUS_ORDER = ['En proceso', 'Publicado', 'Actualizado pendiente de publicar'];

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

const getDisplayName = (row) => {
  const idioma = String(row.scorm_idioma || '');
  const codigo = String(row.scorm_code || '');
  const normalized = `${idioma}${codigo}`.replace(/[\s_\-]+/g, '');
  return normalized || 'Sin nombre mostrado';
};

export default function ScormsTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [activeRow, setActiveRow] = useState(null);
  const [detailDraft, setDetailDraft] = useState(null);
  const [filterInputs, setFilterInputs] = useState({});
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState('table');
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedCardIds, setExpandedCardIds] = useState([]);
  const [dragOverState, setDragOverState] = useState('');
  const [draggedRowIds, setDraggedRowIds] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: queryError } = await supabase
      .from('scorms_master')
      .select('*')
      .order('id', { ascending: true });

    if (queryError) {
      setError(`No se pudieron cargar los datos: ${queryError.message}`);
      setRows([]);
    } else {
      setRows(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      return columns.every((column) => {
        const fieldFilters = filters[column.key] || [];
        if (fieldFilters.length === 0) {
          return true;
        }

        const value =
          column.key === 'scorm_name'
            ? getDisplayName(row).toLowerCase()
            : String(row[column.key] || '').toLowerCase();
        return fieldFilters.some((filterValue) => value.includes(filterValue.toLowerCase()));
      });
    });
  }, [rows, filters]);

  const canRenderTable = useMemo(() => filteredRows.length > 0, [filteredRows.length]);

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

  const openDetails = (row) => {
    setActiveRow(row);
    setDetailDraft({ ...row });
    setStatusMessage('');
    setError('');
  };

  const closeDetails = () => {
    setActiveRow(null);
    setDetailDraft(null);
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

  return (
    <section className="card card-wide">
      <header className="card-header">
        <h2>GScormer · v1.4.0</h2>
        <div className="header-actions">
          <button type="button" className="secondary" disabled={moveHistory.length === 0} onClick={handleUndo}>
            Deshacer
          </button>
          <button type="button" className="secondary" disabled={redoHistory.length === 0} onClick={handleRedo}>
            Rehacer
          </button>
          {viewMode === 'table' ? (
            <button type="button" className="secondary" onClick={() => setViewMode('status')}>
              Vista por estado
            </button>
          ) : (
            <button type="button" className="secondary" onClick={() => setViewMode('table')}>
              Volver a tabla
            </button>
          )}
          <button type="button" className="secondary" onClick={fetchData}>
            Recargar
          </button>
        </div>
      </header>

      <section className="filters card-soft">
        <h3>Filtros</h3>
        <div className="filters-grid compact">
          {columns.map((column) => (
            <details key={column.key} className="filter-dropdown">
              <summary>
                {column.label}
                {(filters[column.key] || []).length > 0 && (
                  <span className="filter-counter">{(filters[column.key] || []).length}</span>
                )}
              </summary>
              <div className="filter-dropdown-content">
                <div className="filter-controls">
                  <input
                    type="text"
                    placeholder={`Añadir filtro en ${column.label}`}
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
            </details>
          ))}
        </div>
      </section>

      {statusMessage && <p className="status ok">{statusMessage}</p>}
      {error && <p className="status error">{error}</p>}

      {loading && <p className="status">Cargando datos...</p>}

      {!loading && !canRenderTable && !error && (
        <p className="status">No hay registros que coincidan con los filtros actuales.</p>
      )}

      {!loading && canRenderTable && viewMode === 'table' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
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
                  {columns.map((column) => (
                    <td key={`${row.id}-${column.key}`} className={`col-${column.key}`}>
                      {column.key === 'scorm_url' ? (
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
                        <span>{getDisplayName(row)}</span>
                      ) : (
                        <span>{row[column.key] || '-'}</span>
                      )}
                    </td>
                  ))}
                  <td>
                    <button type="button" onClick={() => openDetails(row)}>
                      Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && canRenderTable && viewMode === 'status' && (
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
                <h4>{group.state}</h4>
                <p>{group.rows.length} SCORMs</p>
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
                        <strong>{getDisplayName(row)}</strong>
                        <span>{row.scorm_code || 'Sin código'}</span>
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
                            <strong>Etiquetas:</strong> {row.scorm_etiquetas || '-'}
                          </p>
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
                <h3 id="detalle-titulo">{detailDraft.scorm_code || 'Sin código'}</h3>
                <p>{getDisplayName(detailDraft)}</p>
              </div>
              <button type="button" className="secondary" onClick={closeDetails}>
                Cerrar
              </button>
            </header>

            <div className="details-grid">
              {columns.map((column) => (
                <label key={`detail-${column.key}`}>
                  <span>{column.label}</span>
                  <input
                    type="text"
                    value={detailDraft[column.key] || ''}
                    onChange={(event) => updateDetailDraft(column.key, event.target.value)}
                  />
                </label>
              ))}
            </div>

            <footer className="modal-footer">
              <button type="button" onClick={saveDetails}>
                Guardar detalles
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
