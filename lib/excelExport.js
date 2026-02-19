'use client';

const normalizeValueForExcel = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
};

const getOrderedKeys = (rows, preferredKeys = []) => {
  const availableKeys = new Set();

  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (key) {
        availableKeys.add(key);
      }
    });
  });

  const preferredInRows = preferredKeys.filter((key) => availableKeys.has(key));
  const remaining = [...availableKeys].filter((key) => !preferredInRows.includes(key));

  return [...preferredInRows, ...remaining];
};

export const exportRowsToExcel = ({ rows, preferredKeys = [], sheetName, fileName }) => {
  if (!rows || rows.length === 0) {
    return false;
  }

  const orderedKeys = getOrderedKeys(rows, preferredKeys);
  const safeSheetName = String(sheetName || 'Datos').replace(/[\\/:*?\[\]]/g, '_').slice(0, 31);
  const parsedRows = rows.map((row) => {
    return orderedKeys.map((key) => normalizeValueForExcel(row?.[key]));
  });

  const escapeXml = (value) => {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const headerCells = orderedKeys.map((key) => `<Cell><Data ss:Type="String">${escapeXml(key)}</Data></Cell>`).join('');
  const bodyRows = parsedRows
    .map((rowValues) => {
      const cells = rowValues
        .map((value) => `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`)
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  const workbookXml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${escapeXml(safeSheetName)}">
  <Table>
   <Row>${headerCells}</Row>
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName || 'export.xls';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
};
