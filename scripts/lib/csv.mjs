// Minimal RFC4180-ish CSV parser -- handles quoted fields with embedded
// commas and doubled-quote escaping, which Baseball Savant's exports use
// for the "Last, First" player-name column. No dependency needed for this.
export function parseCsv(text) {
  const clean = text.replace(/^﻿/, '').trim();
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && clean[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...dataRows] = rows;
  return dataRows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

export function savantNameToDisplay(lastFirst) {
  const [last, first] = lastFirst.split(',').map((s) => s.trim());
  return first ? `${first} ${last}` : last;
}
