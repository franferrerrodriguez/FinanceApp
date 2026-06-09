const BANK_FORMATS = [
  {
    id: 'bankinter',
    name: 'Bankinter',
    headers: ['fecha', 'concepto', 'importe', 'saldo'],
    dateCols: ['fecha'],
    descCols: ['concepto'],
    amountCols: ['importe'],
  },
  {
    id: 'bbva',
    name: 'BBVA',
    headers: ['fecha', 'concepto', 'movimiento', 'importe', 'disponible'],
    dateCols: ['fecha'],
    descCols: ['concepto'],
    amountCols: ['importe'],
  },
  {
    id: 'santander',
    name: 'Santander',
    headers: ['fecha operación', 'fecha operacion', 'concepto', 'importe', 'saldo'],
    dateCols: ['fecha operación', 'fecha operacion', 'fecha'],
    descCols: ['concepto'],
    amountCols: ['importe'],
  },
  {
    id: 'caixabank',
    name: 'CaixaBank',
    headers: ['data', 'descripció', 'descripcio', 'import', 'saldo'],
    dateCols: ['data', 'fecha'],
    descCols: ['descripció', 'descripcio', 'concepto'],
    amountCols: ['import', 'importe'],
  },
  {
    id: 'fintech',
    name: 'Trade Republic / Revolut / N26',
    headers: ['date', 'description', 'amount', 'balance'],
    dateCols: ['date', 'fecha'],
    descCols: ['description', 'descripcion', 'descripción', 'concepto'],
    amountCols: ['amount', 'importe', 'import'],
  },
];

function normalizeHeader(h) {
  return String(h ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[€$]/g, '')
    .trim();
}

function detectSeparator(firstLine) {
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  if (semicolons >= commas) return ';';
  return ',';
}

function parseCsvLine(line, separator) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === separator && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function parseAmount(raw, decimalSep) {
  if (raw == null || raw === '') return null;
  let s = String(raw).trim().replace(/\s/g, '').replace(/[€$]/g, '');
  if (s.includes('+')) s = s.replace('+', '');
  const isNegative = s.startsWith('-') || s.includes('(');
  s = s.replace(/[()]/g, '').replace(/^-/, '');

  if (decimalSep === ',') {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return isNegative ? -Math.abs(n) : n;
}

function detectDecimalSep(sampleAmounts) {
  let commaDec = 0;
  let dotDec = 0;
  for (const raw of sampleAmounts) {
    const s = String(raw ?? '');
    if (/\d,\d{2}(?:[^\d]|$)/.test(s)) commaDec++;
    if (/\d\.\d{2}(?:[^\d]|$)/.test(s)) dotDec++;
  }
  return commaDec >= dotDec ? ',' : '.';
}

function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/.exec(s);
  if (dmy) {
    let y = Number(dmy[3]);
    if (y < 100) y += 2000;
    return new Date(y, Number(dmy[2]) - 1, Number(dmy[1]));
  }
  return null;
}

function detectBank(headersNorm) {
  for (const fmt of BANK_FORMATS) {
    const matches = fmt.headers.filter((h) => headersNorm.includes(normalizeHeader(h)));
    if (matches.length >= 3) return fmt;
  }
  return null;
}

function pickColumn(headersNorm, candidates) {
  for (const c of candidates) {
    const idx = headersNorm.indexOf(normalizeHeader(c));
    if (idx >= 0) return idx;
  }
  for (let i = 0; i < headersNorm.length; i++) {
    for (const c of candidates) {
      if (headersNorm[i].includes(normalizeHeader(c))) return i;
    }
  }
  return -1;
}

function buildRowsFromMapping(lines, separator, mapping, decimalSep) {
  const { headerLineIndex, dateCol, descCol, amountCol } = mapping;
  const rows = [];
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = parseCsvLine(line, separator);
    const date = parseDate(cells[dateCol]);
    const description = String(cells[descCol] ?? '').trim();
    const amount = parseAmount(cells[amountCol], decimalSep);
    if (!date || amount == null) continue;
    rows.push({
      id: `${date.toISOString().slice(0, 10)}-${i}-${amount}`,
      date,
      dateIso: date.toISOString().slice(0, 10),
      description,
      amount,
      category: null,
    });
  }
  return rows;
}

export function parseBankStatementCsv(text, manualMapping = null) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (lines.length < 2) {
    return { ok: false, error: 'too_few_lines', preview: lines.slice(0, 3) };
  }

  const separator = detectSeparator(lines[0]);
  const headerCells = parseCsvLine(lines[0], separator);
  const headersNorm = headerCells.map(normalizeHeader);

  const sampleAmounts = [];
  for (let i = 1; i < Math.min(lines.length, 6); i++) {
    const cells = parseCsvLine(lines[i], separator);
    sampleAmounts.push(...cells.slice(-2));
  }
  const decimalSep = detectDecimalSep(sampleAmounts);

  let bank = detectBank(headersNorm);
  let mapping;

  if (manualMapping) {
    mapping = {
      headerLineIndex: 0,
      dateCol: manualMapping.dateCol,
      descCol: manualMapping.descCol,
      amountCol: manualMapping.amountCol,
    };
  } else if (bank) {
    mapping = {
      headerLineIndex: 0,
      dateCol: pickColumn(headersNorm, bank.dateCols),
      descCol: pickColumn(headersNorm, bank.descCols),
      amountCol: pickColumn(headersNorm, bank.amountCols),
    };
  } else {
    return {
      ok: false,
      error: 'unknown_format',
      preview: lines.slice(0, 3).map((l) => parseCsvLine(l, separator)),
      headers: headerCells,
      separator,
      decimalSep,
    };
  }

  if (mapping.dateCol < 0 || mapping.descCol < 0 || mapping.amountCol < 0) {
    return {
      ok: false,
      error: 'unknown_format',
      preview: lines.slice(0, 3).map((l) => parseCsvLine(l, separator)),
      headers: headerCells,
      separator,
      decimalSep,
    };
  }

  const movements = buildRowsFromMapping(lines, separator, mapping, decimalSep);
  if (!movements.length) {
    return { ok: false, error: 'no_movements', preview: lines.slice(0, 3) };
  }

  const dates = movements.map((m) => m.date.getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  return {
    ok: true,
    bank: bank?.name ?? 'manual',
    bankId: bank?.id ?? 'manual',
    separator,
    decimalSep,
    headers: headerCells,
    movements,
    count: movements.length,
    dateFrom: minDate,
    dateTo: maxDate,
  };
}

export { BANK_FORMATS, normalizeHeader, parseCsvLine };
