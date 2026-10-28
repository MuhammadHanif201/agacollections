// Reads INSERT statements from a MySQL / MariaDB dump (phpMyAdmin or mysqldump format)
// without a MySQL server. Returns rows as objects keyed by column name.
import fs from 'node:fs';
import readline from 'node:readline';

export type SqlValue = string | number | null;
export type Row = Record<string, SqlValue>;

/** Parse "(1, 'a\'b', NULL), (2, ...)" into arrays of values */
export function parseTuples(src: string): SqlValue[][] {
  const rows: SqlValue[][] = [];
  let i = 0;
  const n = src.length;
  const skipWs = () => { while (i < n && /\s/.test(src[i])) i++; };
  while (i < n) {
    skipWs();
    if (src[i] === ',' || src[i] === ';') { i++; continue; }
    if (src[i] !== '(') { i++; continue; }
    i++; // (
    const row: SqlValue[] = [];
    for (;;) {
      skipWs();
      const ch = src[i];
      if (ch === "'") {
        i++;
        let out = '';
        for (;;) {
          const c = src[i];
          if (c === undefined) throw new Error('Unterminated string in SQL dump');
          if (c === '\\') {
            const e = src[i + 1];
            out += e === 'n' ? '\n' : e === 'r' ? '\r' : e === 't' ? '\t' : e === '0' ? '\0' : e === 'Z' ? '\x1a' : e === 'b' ? '\b' : e;
            i += 2;
          } else if (c === "'" && src[i + 1] === "'") {
            out += "'";
            i += 2;
          } else if (c === "'") {
            i++;
            break;
          } else {
            out += c;
            i++;
          }
        }
        row.push(out);
      } else {
        let j = i;
        while (j < n && src[j] !== ',' && src[j] !== ')') j++;
        const token = src.slice(i, j).trim();
        i = j;
        if (/^null$/i.test(token)) row.push(null);
        else if (/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(token)) row.push(Number(token));
        else row.push(token); // e.g. b'0', X'..'
      }
      skipWs();
      if (src[i] === ',') { i++; continue; }
      if (src[i] === ')') { i++; break; }
      throw new Error(`Unexpected character "${src[i]}" at ${i} in SQL tuple list`);
    }
    rows.push(row);
  }
  return rows;
}

/** All rows of every INSERT INTO `table` (...) VALUES ... statement, grouped by table */
export async function readDump(file: string): Promise<Map<string, Row[]>> {
  const tables = new Map<string, Row[]>();
  const rl = readline.createInterface({ input: fs.createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
  let buf: string | null = null;
  let table = '';
  let columns: string[] = [];
  let inString = false;

  const flush = () => {
    if (buf === null) return;
    const values = buf.replace(/;\s*$/, '');
    const list = tables.get(table) ?? [];
    for (const tuple of parseTuples(values)) {
      const row: Row = {};
      columns.forEach((c, k) => { row[c] = tuple[k] ?? null; });
      list.push(row);
    }
    tables.set(table, list);
    buf = null;
  };

  // A statement ends at ";" outside a string literal
  const endsStatement = (line: string) => {
    for (let k = 0; k < line.length; k++) {
      const c = line[k];
      if (inString) {
        if (c === '\\') { k++; continue; }
        if (c === "'") {
          if (line[k + 1] === "'") { k++; continue; }
          inString = false;
        }
      } else if (c === "'") {
        inString = true;
      } else if (c === ';') {
        return true;
      }
    }
    return false;
  };

  for await (const line of rl) {
    if (buf === null) {
      const m = line.match(/^INSERT INTO `([^`]+)`\s*\(([^)]*)\)\s*VALUES\s*(.*)$/i);
      if (!m) continue;
      table = m[1];
      columns = m[2].split(',').map((c) => c.trim().replace(/`/g, ''));
      buf = m[3];
      inString = false;
      if (endsStatement(m[3])) flush();
      else buf += '\n';
      continue;
    }
    buf += line;
    if (endsStatement(line)) flush();
    else buf += '\n';
  }
  flush();
  return tables;
}
