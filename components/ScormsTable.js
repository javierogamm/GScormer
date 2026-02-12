'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const columns = [
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

const getCategoryColor = (category) => {
  const source = String(category || 'Sin categoría');
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = source.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return {
    backgroundColor: `hsl(${hue} 74% 94%)`,
    borderColor: `hsl(${hue} 62% 80%)`,
    color: `hsl(${hue} 50% 28%)`,
  };
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

        const value = String(row[column.key] || '').toLowerCase();
        return fieldFilters.some((filterValue) => value.includes(filterValue.toLowerCase()));
      });
    });
  }, [rows, filters]);

  const canRenderTable = useMemo(() => filteredRows.length > 0, [filteredRows.length]);

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

  return (
    <section className="card">
      <header className="card-header">
        <h2>Vista de tabla de SCORMs</h2>
        <button type="button" className="secondary" onClick={fetchData}>
          Recargar
        </button>
      </header>

      <section className="filters card-soft">
        <h3>Buscador con filtros por campo</h3>
        <div className="filters-grid">
          {columns.map((column) => (
            <div key={column.key} className="filter-field">
              <p>{column.label}</p>
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
                    title="Quitar filtro"
                  >
                    {value} ✕
                  </button>
                ))}
                {(filters[column.key] || []).length > 0 && (
                  <button
                    type="button"
                    className="clear-filters"
                    onClick={() => clearFieldFilters(column.key)}
                  >
                    Quitar filtros
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {statusMessage && <p className="status ok">{statusMessage}</p>}
      {error && <p className="status error">{error}</p>}

      {loading && <p className="status">Cargando datos...</p>}

      {!loading && !canRenderTable && !error && (
        <p className="status">No hay registros que coincidan con los filtros actuales.</p>
      )}

      {!loading && canRenderTable && (
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
                <p>{detailDraft.scorm_name || 'Sin nombre'}</p>
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
