const HEADER_ALIASES = {
  codigofinal: 'codigo_final',
  codigofinal: 'codigo_final',
  codigoscorm: 'codigo_scorm',
  codigo: 'codigo_scorm',
  idioma: 'idioma',
  nombredelscorm: 'nombre_scorm',
  nombre: 'nombre_scorm',
  tipo: 'tipo',
  responsable: 'responsable',
  categoria: 'categoria',
  categoriacorregida: 'categoria_corregida',
  subcategoria: 'subcategoria',
  url: 'url',
  observaciones: 'observaciones',
  estado: 'estado',
  test: 'test',
};

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .trim();

const normalizeHeader = (header) => HEADER_ALIASES[normalizeText(header)] || null;

const normalizeCell = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized || null;
};

const splitFinalCode = (codigoFinal = '') => {
  const normalized = String(codigoFinal || '').trim().toUpperCase();
  const match = normalized.match(/^([A-Z]{2,3})[-_\s]?((?:SCR)?\d{4,})$/);

  if (!match) {
    return { idioma: null, codigo: null };
  }

  const prefixedCode = match[2].startsWith('SCR') ? match[2] : `SCR${match[2]}`;

  return {
    idioma: match[1],
    codigo: prefixedCode,
  };
};

const normalizeTestValue = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return null;
  }

  const label = normalized.toLowerCase();
  if (['si', 'sí', 'yes', 'y', '1', 'true'].includes(label)) {
    return 'Sí';
  }

  if (['no', 'n', '0', 'false'].includes(label)) {
    return 'No';
  }

  return normalized;
};

const parseDelimitedLine = (line, separator) => {
  const values = [];
  let current = '';
  let isInsideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (isInsideQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        isInsideQuotes = !isInsideQuotes;
      }
      continue;
    }

    if (char === separator && !isInsideQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const parseDelimitedText = (rawText) => {
  const lines = String(rawText || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');

  if (lines.length < 2) {
    return [];
  }

  const separators = ['\t', ';', ','];
  const separator = separators
    .map((candidate) => ({
      candidate,
      score: parseDelimitedLine(lines[0], candidate).length,
    }))
    .sort((a, b) => b.score - a.score)[0]?.candidate || ';';

  const headerValues = parseDelimitedLine(lines[0], separator);
  const headerKeys = headerValues.map(normalizeHeader);

  return lines.slice(1).map((line) => {
    const cells = parseDelimitedLine(line, separator);

    return headerKeys.reduce((acc, key, index) => {
      if (!key) {
        return acc;
      }

      acc[key] = cells[index] ?? '';
      return acc;
    }, {});
  });
};

const parseXmlSpreadsheet = (rawText) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(rawText, 'text/xml');

  if (xml.querySelector('parsererror')) {
    return [];
  }

  const rows = [...xml.querySelectorAll('Workbook Worksheet Table Row')];
  if (rows.length < 2) {
    return [];
  }

  const getCellValue = (cell) => {
    const dataNode = cell.querySelector('Data');
    return dataNode ? dataNode.textContent || '' : '';
  };

  const headerCells = [...rows[0].querySelectorAll('Cell')].map(getCellValue);
  const headerKeys = headerCells.map(normalizeHeader);

  return rows.slice(1).map((row) => {
    const rowCells = [...row.querySelectorAll('Cell')].map(getCellValue);

    return headerKeys.reduce((acc, key, index) => {
      if (!key) {
        return acc;
      }

      acc[key] = rowCells[index] ?? '';
      return acc;
    }, {});
  });
};

export const parseScormExcelRows = async (file) => {
  const rawText = await file.text();
  const looksLikeXmlSpreadsheet = /<Workbook[\s\S]*<Worksheet/i.test(rawText);

  const parsedRows = looksLikeXmlSpreadsheet ? parseXmlSpreadsheet(rawText) : parseDelimitedText(rawText);

  return parsedRows
    .map((row) => {
      const rawFinalCode = normalizeCell(row.codigo_final);
      const codeFromFinal = splitFinalCode(rawFinalCode);
      const idioma = normalizeCell(row.idioma)?.toUpperCase() || codeFromFinal.idioma;
      const codigoScorm = normalizeCell(row.codigo_scorm)?.toUpperCase() || codeFromFinal.codigo;
      const nombre = normalizeCell(row.nombre_scorm);

      if (!codigoScorm || !nombre) {
        return null;
      }

      return {
        scorm_idioma: idioma,
        scorm_code: codigoScorm,
        scorm_name: nombre,
        scorm_tipo: normalizeCell(row.tipo),
        scorm_responsable: normalizeCell(row.responsable),
        scorm_categoria: normalizeCell(row.categoria_corregida) || normalizeCell(row.categoria),
        scorm_subcategoria: normalizeCell(row.subcategoria),
        scorm_url: normalizeCell(row.url),
        scorm_observaciones: normalizeCell(row.observaciones),
        scorm_estado: normalizeCell(row.estado) || 'En proceso',
        scorm_test: normalizeTestValue(row.test),
      };
    })
    .filter(Boolean);
};

export const getScormImportKey = (row) => `${String(row.scorm_idioma || '').trim().toUpperCase()}|${String(row.scorm_code || '').trim().toUpperCase()}`;
