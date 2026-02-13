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

const isUrl = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized.startsWith('http://') || normalized.startsWith('https://');
};

export default function ScormsCursosTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [filterInputs, setFilterInputs] = useState({});
  const [filters, setFilters] = useState({});
  const [activeRow, setActiveRow] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    const response = await supabase.from('scorms_cursos').select('*').order('id', { ascending: true });

    if (response.error) {
      setRows([]);
      setError(`No se pudieron cargar los cursos: ${response.error.message}`);
    } else {
      setRows(response.data || []);
      setStatusMessage(`Cursos cargados: ${(response.data || []).length}`);
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
        </div>
      </div>

      {statusMessage ? <p className="status ok">{statusMessage}</p> : null}
      {error ? <p className="status error">{error}</p> : null}

      <details className="table-filters-toggle global-filters-toggle" open>
        <summary>Panel de filtros ({Object.keys(filters).length} activos)</summary>
        <div className="filters-grid compact">
          {columns.map((column) => {
            const appliedFilters = filters[column.key] || [];

            return (
              <div key={column.key} className="filter-dropdown">
                <details>
                  <summary>
                    {column.label}
                    {appliedFilters.length > 0 ? <span className="filter-counter">{appliedFilters.length}</span> : null}
                  </summary>
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
                </details>
              </div>
            );
          })}
        </div>
      </details>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => {
                  const value = row[column.key];

                  return (
                    <td key={`${row.id}-${column.key}`} className={column.key === 'curso_nombre' ? 'col-curso_nombre' : ''}>
                      {isUrl(value) ? (
                        <a className="table-link" href={value} target="_blank" rel="noreferrer">
                          Abrir enlace
                        </a>
                      ) : (
                        String(value || '-')
                      )}
                    </td>
                  );
                })}
                <td>
                  <button className="secondary" onClick={() => setActiveRow(row)}>
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRows.length === 0 ? <p className="status">No hay registros que coincidan con los filtros actuales.</p> : null}

      {activeRow ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="curso-detalle-title">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3 id="curso-detalle-title">Detalle del curso</h3>
                <p>{activeRow.curso_nombre || activeRow.pa_nombre || 'Sin nombre'}</p>
              </div>
              <button className="secondary" onClick={() => setActiveRow(null)}>
                Cerrar
              </button>
            </div>

            <div className="details-grid">
              {columns.map((column) => (
                <label key={`detail-${column.key}`}>
                  <span>{column.label}</span>
                  <input value={String(activeRow[column.key] || '')} readOnly />
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
