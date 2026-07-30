/**
 * 🌟 BÚNKER DE MELISA — Directora Creativa & Growth Marketing
 * Servicio de IA que transforma novedades crudas de comercios en
 * copies persuasivos y títulos de alto impacto para el Muro de Novedades.
 *
 * Arquitectura:
 * - Motor Principal: Gemini API (Google AI Studio) — temperatura 0.6
 * - Motor de Respaldo: Plantillas locales inteligentes (resiliente a fallas de red)
 */

export interface MelisaOutput {
  titulo: string;        // Máx 40 caracteres — alto impacto
  microcopy: string;     // Máx 150 caracteres — persuasivo y directo
  categoria: Categoria;
  tag: string;           // Ej: "🔥 ÚLTIMOS CUPOS", "⚡ 2x1 HOY"
  color: string;         // Color de acento de la tarjeta
  emoji: string;         // Emoji representativo
}

export type Categoria =
  | 'Espectáculos'
  | 'Gastronomía'
  | 'Indumentaria'
  | 'Servicios'
  | 'Turismo'
  | 'Ofertas Flash'
  | 'General';

export interface NovedadInput {
  textoLibre: string;    // El texto crudo del comerciante
  comercioNombre?: string;
  imagenUrl?: string;
}

const MELISA_SYSTEM_PROMPT = `Eres Melisa, Directora Creativa de ShopDigital.ar, la guía digital de la Patagonia.
Tu misión es transformar descripciones crudas de comercios en microcopies atractivos y concisos para tarjetas de novedades en una app móvil.

REGLAS ESTRICTAS:
- titulo: máximo 40 caracteres, impactante, en MAYÚSCULAS, sin punto final
- microcopy: máximo 150 caracteres, persuasivo, en oración normal, incluye emoji relevante al inicio
- categoria: debe ser exactamente una de: "Espectáculos", "Gastronomía", "Indumentaria", "Servicios", "Turismo", "Ofertas Flash", "General"
- tag: etiqueta urgente de máx 20 caracteres con emoji (ej: "🔥 ÚLTIMOS CUPOS", "⚡ 2x1 HOY", "🆕 NUEVO", "⏰ HOY SOLO")
- color: color hex vibrante acorde a la categoría
- emoji: un solo emoji representativo

Responde ÚNICAMENTE con un objeto JSON válido con exactamente estas 6 claves: titulo, microcopy, categoria, tag, color, emoji.
Sin texto extra, sin markdown, solo el JSON puro.`;

const CATEGORIA_KEYWORDS: Record<Categoria, string[]> = {
  'Espectáculos': ['show', 'recital', 'concierto', 'fiesta', 'evento', 'entrada', 'tocata', 'axel', 'banda', 'teatro', 'cine'],
  'Gastronomía': ['pizza', 'resto', 'restaurant', 'parrilla', 'sushi', 'cerveza', 'cafe', 'té', 'delivery', 'menu', 'comida', 'plato', 'bodega'],
  'Indumentaria': ['ropa', 'moda', 'calzado', 'zapatilla', 'camisa', 'remera', 'jean', 'prenda', 'sale', 'temporada'],
  'Servicios': ['turno', 'servicio', 'consulta', 'asesoramiento', 'agenda', 'profesional', 'técnico'],
  'Turismo': ['excursion', 'tour', 'circuito', 'trekking', 'lago', 'montaña', 'esqui', 'nieve', 'patagonia'],
  'Ofertas Flash': ['descuento', '2x1', '50%', '30%', 'oferta', 'promo', 'liquidacion', 'super precio', 'hoy'],
  'General': [],
};

const CATEGORY_COLORS: Record<Categoria, string> = {
  'Espectáculos': '#FF4B8B',
  'Gastronomía': '#FF8C42',
  'Indumentaria': '#A855F7',
  'Servicios': '#3B82F6',
  'Turismo': '#10B981',
  'Ofertas Flash': '#F59E0B',
  'General': '#6366F1',
};

const CATEGORY_EMOJIS: Record<Categoria, string> = {
  'Espectáculos': '🎭',
  'Gastronomía': '🍕',
  'Indumentaria': '👗',
  'Servicios': '🔧',
  'Turismo': '🏔️',
  'Ofertas Flash': '⚡',
  'General': '✨',
};

function detectarCategoria(texto: string): Categoria {
  const textoLower = texto.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORIA_KEYWORDS) as [Categoria, string[]][]) {
    if (keywords.some((kw) => textoLower.includes(kw))) return cat;
  }
  return 'General';
}

function truncar(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  return texto.substring(0, max - 1).trimEnd() + '…';
}

function generarFallbackLocal(input: NovedadInput): MelisaOutput {
  const { textoLibre, comercioNombre } = input;
  const categoria = detectarCategoria(textoLibre);
  const palabras = textoLibre.split(' ').slice(0, 5).join(' ').toUpperCase();
  const tituloBase = comercioNombre
    ? `${comercioNombre.toUpperCase()} — ${palabras}`
    : palabras;

  const TAGS: Record<Categoria, string> = {
    'Espectáculos': '🎟️ CONSEGUÍ TU ENTRADA',
    'Gastronomía': '🍽️ RESERVÁ AHORA',
    'Indumentaria': '🛍️ NUEVA TEMPORADA',
    'Servicios': '📅 AGENDÁ TU TURNO',
    'Turismo': '🏔️ EXPLORÁ LA PATA',
    'Ofertas Flash': '⚡ OFERTA LIMITADA',
    'General': '🆕 NOVEDAD HOY',
  };

  return {
    titulo: truncar(tituloBase, 40),
    microcopy: truncar(`✨ ${textoLibre}`, 150),
    categoria,
    tag: TAGS[categoria],
    color: CATEGORY_COLORS[categoria],
    emoji: CATEGORY_EMOJIS[categoria],
  };
}

async function generarConGemini(input: NovedadInput): Promise<MelisaOutput> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY) as string | undefined;

  if (!apiKey) {
    return generarFallbackLocal(input);
  }

  const prompt = `Texto crudo del comercio: "${input.textoLibre}"${input.comercioNombre ? `\nNombre del comercio: "${input.comercioNombre}"` : ''}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: MELISA_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 256,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const data = await response.json();
    const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as MelisaOutput;

    return {
      titulo: truncar(parsed.titulo ?? '', 40),
      microcopy: truncar(parsed.microcopy ?? '', 150),
      categoria: (parsed.categoria as Categoria) ?? 'General',
      tag: parsed.tag ?? '🆕 NOVEDAD',
      color: parsed.color ?? CATEGORY_COLORS['General'],
      emoji: parsed.emoji ?? '✨',
    };
  } catch (error) {
    console.error('[Melisa] Fallback local activado:', error);
    return generarFallbackLocal(input);
  }
}

export async function procesarNovedad(input: NovedadInput): Promise<MelisaOutput> {
  return generarConGemini(input);
}

export const NOVEDADES_DEMO: Array<NovedadInput & { id: string; imagenUrl: string }> = [
  {
    id: 'nov-001',
    textoLibre: 'Sábado toca Axel en Monte Grande, quedan pocas entradas, no te lo pierdas',
    comercioNombre: 'Teatro del Lago',
    imagenUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b4a2b5e?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'nov-002',
    textoLibre: '2x1 en pizzas artesanales todos los martes, delivery incluido a toda la ciudad',
    comercioNombre: 'La Piazzetta Patagónica',
    imagenUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'nov-003',
    textoLibre: 'Excursión al Volcán Lanín este finde con guía certificado, cupos limitados',
    comercioNombre: 'Andes Trek',
    imagenUrl: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&q=80&w=800',
  },
];
