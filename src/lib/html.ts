// html_entity_decode(strip_tags(...)) helpers for product descriptions written in the admin editor.

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', bull: '•', middot: '·', times: '×', copy: '©', reg: '®', trade: '™',
  laquo: '«', raquo: '»', deg: '°', euro: '€', pound: '£', rarr: '→', larr: '←',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return NAMED[code.toLowerCase()] ?? m;
  });
}

export const stripTags = (html: string) => html.replace(/<[^>]*>/g, '');

/** trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($html)))) */
export const plainText = (html: string) => decodeEntities(stripTags(html)).replace(/\s+/gu, ' ').trim();
