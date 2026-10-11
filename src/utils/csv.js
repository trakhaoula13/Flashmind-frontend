// Lecture de fichiers CSV / TSV / exports Anki (.txt) → cartes FlashMind

const FRONT_HEADERS = ['front', 'recto', 'mot', 'word', 'question', 'term', 'terme'];
const BACK_HEADERS = ['back', 'verso', 'definition', 'définition', 'answer', 'reponse', 'réponse', 'meaning', 'explication'];
const EXAMPLE_HEADERS = ['example', 'exemple'];
const TAG_HEADERS = ['tags', 'tag', 'etiquettes', 'étiquettes'];
const COLOR_HEADERS = ['color', 'colour', 'couleur'];

export const TEMPLATE_CSV =
  '\uFEFFrecto,verso,tags,couleur\n' +
  'mitigate,"lessen the effect\nMeasures to mitigate climate change are urgent.",anglais b2,#10A5A0\n' +
  'tackle,"deal with firmly\nThe government must tackle unemployment.",anglais b2,#3B8FD9\n' +
  'albeit,"although\nIt was a small, albeit important, change.",anglais c1,\n';

export function detectDelimiter(text) {
  if (text.includes('\t')) return '\t';
  const sample = text.split(/\r?\n/).slice(0, 10).join('\n');
  const semicolons = (sample.match(/;/g) || []).length;
  const commas = (sample.match(/,/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

// Analyse CSV avec guillemets, retours à la ligne dans un champ et "" échappés
export function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"' && field === '') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Les exports Anki contiennent du HTML (<b>, <br>…) : on le convertit en texte simple
function cleanText(value = '') {
  return String(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const splitTags = (value = '') =>
  [...new Set(String(value).split(/[\s;|,]+/).map((t) => t.replace(/^#/, '').trim()).filter(Boolean))].slice(0, 10);

const validColor = (value = '') => (/^#[0-9a-fA-F]{6}$/.test(String(value).trim()) ? String(value).trim() : undefined);

export function parseCards(rawText) {
  const lines = String(rawText).replace(/^\uFEFF/, '').split(/\r?\n/);
  while (lines.length && lines[0].startsWith('#')) lines.shift(); // en-têtes Anki (#separator:tab…)
  const body = lines.join('\n');
  if (!body.trim()) return { cards: [], ignored: 0, delimiter: ',' };

  const delimiter = detectDelimiter(body);
  let rows = parseDelimited(body, delimiter).filter((r) => r.some((c) => c.trim() !== ''));

  // Colonnes : par défaut recto, verso, tags, couleur
  let map = { front: 0, back: 1, example: -1, tags: 2, color: 3 };
  if (rows.length) {
    const head = rows[0].map((c) => c.trim().toLowerCase());
    if (FRONT_HEADERS.includes(head[0]) && BACK_HEADERS.includes(head[1])) {
      map = {
        front: 0,
        back: 1,
        example: head.findIndex((h) => EXAMPLE_HEADERS.includes(h)),
        tags: head.findIndex((h) => TAG_HEADERS.includes(h)),
        color: head.findIndex((h) => COLOR_HEADERS.includes(h)),
      };
      rows = rows.slice(1);
    }
  }

  const cards = [];
  let ignored = 0;
  for (const row of rows) {
    const front = cleanText(row[map.front]);
    let back = cleanText(row[map.back]);
    if (map.example >= 0 && row[map.example]) back = `${back}\n${cleanText(row[map.example])}`.trim();
    if (!front || !back) {
      ignored += 1;
      continue;
    }
    const card = { front: front.slice(0, 1000), back: back.slice(0, 2000) };
    const tags = map.tags >= 0 ? splitTags(row[map.tags]) : [];
    const color = map.color >= 0 ? validColor(row[map.color]) : undefined;
    if (tags.length) card.tags = tags;
    if (color) card.color = color;
    cards.push(card);
  }
  return { cards, ignored, delimiter };
}
