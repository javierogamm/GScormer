'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const columns = [
  { key: 'id', label: 'ID', editable: false },
  { key: 'created_at', label: 'Creado', editable: false },
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

export default function ScormsTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

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

  const canRenderTable = useMemo(() => rows.length > 0, [rows.length]);

  const updateLocalCell = (rowIndex, field, value) => {
    setRows((previousRows) => {
      const updatedRows = [...previousRows];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        [field]: value,
      };
      return updatedRows;
    });
  };

  const saveRow = async (rowIndex) => {
    const row = rows[rowIndex];
    const payload = editableColumns.reduce((acc, key) => {
      acc[key] = row[key] || null;
      return acc;
    }, {});

    const { error: updateError } = await supabase
      .from('scorms_master')
      .update(payload)
      .eq('id', row.id);

    if (updateError) {
      setStatusMessage('');
      setError(`No se pudo guardar la fila ${row.id}: ${updateError.message}`);
      return;
    }

    setError('');
    setStatusMessage(`Fila ${row.id} actualizada correctamente.`);
  };

  return (
    <section className="card">
      <header className="card-header">
        <h2>Vista de tabla de SCORMs</h2>
        <button type="button" className="secondary" onClick={fetchData}>
          Recargar
        </button>
      </header>

      {statusMessage && <p className="status ok">{statusMessage}</p>}
      {error && <p className="status error">{error}</p>}

      {loading && <p className="status">Cargando datos...</p>}

      {!loading && !canRenderTable && !error && (
        <p className="status">No hay registros disponibles en la tabla.</p>
      )}

      {!loading && canRenderTable && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={`${row.id}-${column.key}`}>
                      {column.editable ? (
                        <input
                          type="text"
                          value={row[column.key] || ''}
                          onChange={(event) =>
                            updateLocalCell(rowIndex, column.key, event.target.value)
                          }
                        />
                      ) : (
                        <span>
                          {column.key === 'created_at'
                            ? new Date(row[column.key]).toLocaleString('es-ES')
                            : row[column.key]}
                        </span>
                      )}
                    </td>
                  ))}
                  <td>
                    <button type="button" onClick={() => saveRow(rowIndex)}>
                      Guardar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
