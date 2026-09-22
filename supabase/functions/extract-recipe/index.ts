// Supabase Edge Function: extract-recipe
//
// Nimmt einen Rezept-Link entgegen, lädt die Seite serverseitig (kein CORS-Problem,
// da server-to-server), schickt den Textinhalt an Claude (Anthropic API) und gibt
// ein strukturiertes Rezept-Objekt zurück, das direkt ins Formular passt.
// Zusätzlich wird versucht, das Vorschaubild der Seite (og:image/twitter:image)
// zu finden, herunterzuladen und dauerhaft im "recipe-images"-Bucket abzulegen.
//
// Braucht das Secret ANTHROPIC_API_KEY (siehe Setup-Anleitung).
// SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY sind in Supabase Edge Functions
// automatisch als Umgebungsvariablen vorhanden, dafür ist kein eigenes Secret nötig.

// Nur für Typen im Editor, wird beim Deploy ignoriert.
// @ts-ignore
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
// @ts-ignore Deno-Import, wird zur Laufzeit von Supabase aufgelöst
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CATEGORIES = [
  'Frühstück',
  'Hauptgericht',
  'Kleine Gerichte & Beilagen',
  'Snacks',
  'Fermentation',
  'Süßes',
];

const FOOD_EMOJIS = [
  '🥣', '🥗', '🐟', '🥩', '🍳', '🥞', '🍜', '🍝', '🥘', '🫕',
  '🥧', '🍰', '🎂', '🍩', '🍪', '🥐', '🥨', '🧀', '🥚', '🧆',
  '🌮', '🌯', '🥙', '🧇', '🥓', '🥪', '🍱', '🍛', '🍲', '🫔',
  '🥦', '🥕', '🥑', '🍋', '🍓', '🫐', '🍇', '🍒', '🍑', '🫙',
  '🍽️', '🥄', '🍴', '🧂', '🫚', '🥜', '🌾', '🥬', '🍅', '🧅',
];

const MODEL = 'claude-haiku-4-5';
const MAX_PAGE_TEXT_CHARS = 20000;
const FETCH_TIMEOUT_MS = 10000;
const IMAGE_BUCKET = 'recipe-images';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// @ts-ignore Deno global ist zur Laufzeit auf Supabase verfügbar
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Nur POST erlaubt.' }, 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Ungültiger Request-Body.' }, 400);
  }

  const url = (body as { url?: unknown })?.url;
  if (!url || typeof url !== 'string') {
    return jsonResponse({ error: 'Bitte einen gültigen Link angeben.' }, 400);
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return jsonResponse({ error: 'Das ist keine gültige URL.' }, 400);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return jsonResponse({ error: 'Nur http/https-Links werden unterstützt.' }, 400);
  }
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.')
  ) {
    return jsonResponse({ error: 'Diese Adresse wird nicht unterstützt.' }, 400);
  }

  // 1. Seite laden
  let html: string;
  try {
    // @ts-ignore Deno global
    const pageRes = await fetch(parsed.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MannaKochtBot/1.0)' },
      // @ts-ignore Deno global
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!pageRes.ok) {
      return jsonResponse({ error: `Seite konnte nicht geladen werden (Status ${pageRes.status}).` }, 502);
    }
    html = await pageRes.text();
  } catch {
    return jsonResponse({ error: 'Seite konnte nicht erreicht werden. Ist der Link korrekt?' }, 502);
  }

  const pageText = htmlToText(html).slice(0, MAX_PAGE_TEXT_CHARS);
  if (!pageText.trim()) {
    return jsonResponse({ error: 'Auf dieser Seite wurde kein lesbarer Inhalt gefunden.' }, 422);
  }

  // 2. Claude extrahieren lassen
  // @ts-ignore Deno global
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) {
    return jsonResponse({ error: 'Server ist nicht korrekt konfiguriert (fehlender API-Key).' }, 500);
  }

  let aiData: any;
  try {
    // @ts-ignore Deno global
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: buildSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: `Seiten-URL: ${parsed.toString()}\n\nText-Inhalt der Seite:\n\n${pageText}`,
          },
        ],
      }),
    });
    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('Anthropic API error', aiRes.status, errText);
      return jsonResponse({ error: 'Die Rezept-Erkennung ist fehlgeschlagen.' }, 502);
    }
    aiData = await aiRes.json();
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Die Rezept-Erkennung ist fehlgeschlagen.' }, 502);
  }

  const rawText: string = aiData?.content?.[0]?.text ?? '';
  const extracted = extractJson(rawText);

  if (!extracted || extracted.error) {
    return jsonResponse({ error: 'Auf dieser Seite konnte kein Rezept erkannt werden.' }, 422);
  }
  if (!extracted.name || !extracted.ingredients || !extracted.instructions) {
    return jsonResponse({ error: 'Das Rezept konnte nicht vollständig extrahiert werden.' }, 422);
  }

  // 3. Vorschaubild suchen, herunterladen und dauerhaft ablegen (bestes Bemühen –
  // schlägt das fehl, geben wir trotzdem das Rezept ohne Bild zurück).
  let imageUrl: string | null = null;
  try {
    const sourceImageUrl = findPageImage(html, parsed);
    if (sourceImageUrl) {
      imageUrl = await downloadAndStoreImage(sourceImageUrl);
    }
  } catch (err) {
    console.error('Bild-Übernahme fehlgeschlagen', err);
  }

  return jsonResponse({ recipe: { ...sanitizeRecipe(extracted), image_url: imageUrl } });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function buildSystemPrompt() {
  return `Du bekommst den Textinhalt einer Rezept-Webseite (z.B. von einem Food-Blog). Extrahiere daraus NUR das eigentliche Rezept und die Zutaten - ignoriere Blogger-Geschichten, Einleitungen, Werbung, Kommentare, verwandte Rezepte, Pairing-Vorschläge etc.

Antworte AUSSCHLIESSLICH mit einem einzigen JSON-Objekt (keine Erklärung, kein Markdown, kein Codeblock) in genau diesem Format:
{
  "name": "Kurzer, prägnanter Rezeptname",
  "category": "eine von genau diesen Optionen: ${CATEGORIES.join(', ')}",
  "time_minutes": Zahl (geschätzte Gesamtzeit in Minuten - falls nicht angegeben, realistisch schätzen),
  "emoji": "ein passendes Emoji aus dieser Liste: ${FOOD_EMOJIS.join(' ')}",
  "ingredients": "Zutaten als Text, eine Zutat pro Zeile (mit \\n getrennt), inkl. Mengenangaben",
  "instructions": "Zubereitungsschritte als Text, ein Schritt pro Zeile (mit \\n getrennt)",
  "tip": "ein kurzer hilfreicher Tipp aus dem Originaltext, falls vorhanden - sonst null"
}

Falls auf der Seite kein erkennbares Kochrezept vorhanden ist, antworte ausschließlich mit: {"error": "kein Rezept gefunden"}`;
}

function extractJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function sanitizeRecipe(r: any) {
  const category = CATEGORIES.includes(r.category) ? r.category : CATEGORIES[0];
  const emoji = typeof r.emoji === 'string' && r.emoji.trim() ? r.emoji.trim() : '🍽️';
  const time = Number(r.time_minutes);
  return {
    name: String(r.name).trim().slice(0, 120),
    category,
    time_minutes: Number.isFinite(time) && time > 0 ? Math.round(time) : 20,
    emoji,
    ingredients: String(r.ingredients).trim(),
    instructions: String(r.instructions).trim(),
    tip: r.tip ? String(r.tip).trim() : null,
  };
}

function htmlToText(html: string): string {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  cleaned = cleaned.replace(/<[^>]+>/g, '\n');
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
  return cleaned;
}

// Sucht og:image / twitter:image Meta-Tags im rohen HTML und löst relative
// URLs gegen die Seiten-URL auf.
function findPageImage(html: string, pageUrl: URL): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      try {
        return new URL(match[1], pageUrl).toString();
      } catch {
        continue;
      }
    }
  }
  return null;
}

// Lädt ein Bild herunter und legt es dauerhaft im Storage-Bucket ab, statt nur
// den (potenziell instabilen) externen Link zu speichern.
async function downloadAndStoreImage(imageUrl: string): Promise<string | null> {
  // @ts-ignore Deno global
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  // @ts-ignore Deno global
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY fehlen – Bild wird übersprungen.');
    return null;
  }

  // @ts-ignore Deno global
  const imgRes = await fetch(imageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MannaKochtBot/1.0)' },
    // @ts-ignore Deno global
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!imgRes.ok) return null;

  const contentType = imgRes.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) return null;

  const buffer = await imgRes.arrayBuffer();
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) return null;

  const extension = contentType.includes('png')
    ? 'png'
    : contentType.includes('webp')
      ? 'webp'
      : contentType.includes('gif')
        ? 'gif'
        : 'jpg';
  const path = `${crypto.randomUUID()}.${extension}`;

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await admin.storage.from(IMAGE_BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) {
    console.error('Storage-Upload fehlgeschlagen', error);
    return null;
  }

  const { data } = admin.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl ?? null;
}
