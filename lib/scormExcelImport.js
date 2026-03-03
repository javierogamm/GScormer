const HEADER_ALIASES = {
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

const textDecoder = new TextDecoder('utf-8');

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

const parseXml = (xmlText) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');

  if (xml.querySelector('parsererror')) {
    throw new Error('No se ha podido interpretar el XML interno del XLSX.');
  }

  return xml;
};

const resolveZipDateFromOffset = (view, offset) => {
  const signature = view.getUint32(offset, true);
  if (signature !== 0x04034b50) {
    throw new Error('Cabecera ZIP local no válida en el XLSX.');
  }

  const fileNameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const dataOffset = offset + 30 + fileNameLength + extraLength;

  return dataOffset;
};

const inflateRaw = async (bytes) => {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Este navegador no soporta descompresión necesaria para leer .xlsx.');
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const arrayBuffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

const unzipEntries = async (arrayBuffer) => {
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  const entries = new Map();

  let eocdOffset = -1;
  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }

  if (eocdOffset < 0) {
    throw new Error('El archivo no tiene estructura ZIP válida para .xlsx.');
  }

  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);

  let pointer = centralDirectoryOffset;
  for (let index = 0; index < totalEntries; index += 1) {
    const signature = view.getUint32(pointer, true);
    if (signature !== 0x02014b50) {
      throw new Error('Directorio central ZIP inválido en .xlsx.');
    }

    const compressionMethod = view.getUint16(pointer + 10, true);
    const compressedSize = view.getUint32(pointer + 20, true);
    const fileNameLength = view.getUint16(pointer + 28, true);
    const extraLength = view.getUint16(pointer + 30, true);
    const commentLength = view.getUint16(pointer + 32, true);
    const localHeaderOffset = view.getUint32(pointer + 42, true);

    const fileNameStart = pointer + 46;
    const fileNameEnd = fileNameStart + fileNameLength;
    const entryName = textDecoder.decode(bytes.slice(fileNameStart, fileNameEnd));

    const dataOffset = resolveZipDateFromOffset(view, localHeaderOffset);
    const compressedBytes = bytes.slice(dataOffset, dataOffset + compressedSize);

    let dataBytes;
    if (compressionMethod === 0) {
      dataBytes = compressedBytes;
    } else if (compressionMethod === 8) {
      dataBytes = await inflateRaw(compressedBytes);
    } else {
      throw new Error(`Método de compresión no soportado en XLSX (${compressionMethod}).`);
    }

    entries.set(entryName, dataBytes);
    pointer = fileNameEnd + extraLength + commentLength;
  }

  return entries;
};

const getEntryText = (entries, path) => {
  const bytes = entries.get(path);
  if (!bytes) {
    return null;
  }

  return textDecoder.decode(bytes);
};

const toAbsoluteZipPath = (basePath, targetPath) => {
  if (!targetPath) {
    return null;
  }

  const baseSegments = basePath.split('/').slice(0, -1);
  const targetSegments = targetPath.split('/');
  const resolved = [...baseSegments];

  targetSegments.forEach((segment) => {
    if (!segment || segment === '.') {
      return;
    }

    if (segment === '..') {
      resolved.pop();
      return;
    }

    resolved.push(segment);
  });

  return resolved.join('/');
};

const getCellColumnIndex = (cellRef = '') => {
  const match = String(cellRef).match(/^([A-Z]+)/i);
  if (!match) {
    return null;
  }

  return match[1].toUpperCase().split('').reduce((acc, char) => (acc * 26) + (char.charCodeAt(0) - 64), 0) - 1;
};

const readSharedStrings = (entries) => {
  const xmlText = getEntryText(entries, 'xl/sharedStrings.xml');
  if (!xmlText) {
    return [];
  }

  const xml = parseXml(xmlText);
  const items = [...xml.querySelectorAll('sst > si')];

  return items.map((item) => [...item.querySelectorAll('t')].map((node) => node.textContent || '').join(''));
};

const readWorksheetRows = (entries) => {
  const workbookXmlText = getEntryText(entries, 'xl/workbook.xml');
  const workbookRelsText = getEntryText(entries, 'xl/_rels/workbook.xml.rels');

  if (!workbookXmlText || !workbookRelsText) {
    throw new Error('No se ha encontrado la estructura principal del .xlsx.');
  }

  const workbookXml = parseXml(workbookXmlText);
  const workbookRelsXml = parseXml(workbookRelsText);

  const firstSheet = workbookXml.querySelector('workbook > sheets > sheet');
  const relationId = firstSheet?.getAttribute('r:id');

  const relationNode = [...workbookRelsXml.querySelectorAll('Relationships > Relationship')].find(
    (node) => node.getAttribute('Id') === relationId
  );

  const targetPath = relationNode?.getAttribute('Target');
  const worksheetPath = toAbsoluteZipPath('xl/workbook.xml', targetPath);

  if (!worksheetPath) {
    throw new Error('No se pudo resolver la hoja principal del .xlsx.');
  }

  const worksheetXmlText = getEntryText(entries, worksheetPath);
  if (!worksheetXmlText) {
    throw new Error('No se pudo leer la hoja principal del .xlsx.');
  }

  const worksheetXml = parseXml(worksheetXmlText);
  const sharedStrings = readSharedStrings(entries);
  const rowNodes = [...worksheetXml.querySelectorAll('worksheet > sheetData > row')];

  return rowNodes.map((rowNode) => {
    const rowValues = [];

    [...rowNode.querySelectorAll('c')].forEach((cellNode, cellIndex) => {
      const ref = cellNode.getAttribute('r');
      const columnIndex = getCellColumnIndex(ref);
      const resolvedIndex = columnIndex ?? cellIndex;
      const type = cellNode.getAttribute('t');
      const valueNode = cellNode.querySelector('v');
      const inlineValueNode = cellNode.querySelector('is > t');

      let value = '';
      if (type === 's') {
        const sharedIndex = Number(valueNode?.textContent || '');
        value = Number.isFinite(sharedIndex) ? (sharedStrings[sharedIndex] || '') : '';
      } else if (type === 'inlineStr') {
        value = inlineValueNode?.textContent || '';
      } else {
        value = valueNode?.textContent || '';
      }

      rowValues[resolvedIndex] = value;
    });

    return rowValues;
  });
};

const parseXlsx = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const entries = await unzipEntries(arrayBuffer);
  const rows = readWorksheetRows(entries);

  if (rows.length < 2) {
    return [];
  }

  const headerKeys = rows[0].map(normalizeHeader);

  return rows.slice(1).map((rowCells) => {
    return headerKeys.reduce((acc, key, index) => {
      if (!key) {
        return acc;
      }

      acc[key] = rowCells[index] ?? '';
      return acc;
    }, {});
  });
};

const mapRowsToScormPayload = (parsedRows) => {
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

export const parseScormExcelRows = async (file) => {
  const fileName = String(file?.name || '').toLowerCase();

  if (fileName.endsWith('.xlsx')) {
    const xlsxRows = await parseXlsx(file);
    return mapRowsToScormPayload(xlsxRows);
  }

  const rawText = await file.text();
  const looksLikeXmlSpreadsheet = /<Workbook[\s\S]*<Worksheet/i.test(rawText);

  const parsedRows = looksLikeXmlSpreadsheet ? parseXmlSpreadsheet(rawText) : parseDelimitedText(rawText);
  return mapRowsToScormPayload(parsedRows);
};

export const getScormImportKey = (row) => `${String(row.scorm_idioma || '').trim().toUpperCase()}|${String(row.scorm_code || '').trim().toUpperCase()}`;
