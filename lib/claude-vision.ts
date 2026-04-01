import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.NOK_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY })

export type ExtractedSpace = {
  name: string
  width_m: number | null
  length_m: number | null
  area_m2: number | null
}

export type FloorPlanAnalysis = {
  spaces: ExtractedSpace[]
  bedrooms: number
  bathrooms: number
  total_area_m2: number | null
  notes: string | null
}

/**
 * Analyzes a floor plan PDF and extracts space dimensions.
 * Returns structured data for use in the onboarding chat context.
 */
export async function analyzeFloorPlan(pdfBase64: string): Promise<FloorPlanAnalysis> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: `Eres un asistente de NOK, empresa de gestión de apartamentos de corto plazo.
Analiza este plano arquitectónico y extrae la información de cada espacio.

Responde ÚNICAMENTE con JSON válido en este formato exacto (sin texto adicional):
{
  "spaces": [
    { "name": "Sala", "width_m": 4.5, "length_m": 3.2, "area_m2": 14.4 },
    { "name": "Cocina", "width_m": 3.0, "length_m": 2.5, "area_m2": 7.5 },
    { "name": "Habitación 1", "width_m": 3.8, "length_m": 3.0, "area_m2": 11.4 },
    { "name": "Baño 1", "width_m": 2.0, "length_m": 1.8, "area_m2": 3.6 }
  ],
  "bedrooms": 1,
  "bathrooms": 1,
  "total_area_m2": 45.0,
  "notes": "Apartamento tipo estudio con balcón"
}

Reglas:
- Si no puedes determinar una dimensión exacta, pon null
- Incluye TODOS los espacios visibles: sala, comedor, cocina, habitaciones, baños, lavandería, balcón/terraza, estudio, recibidor
- "bedrooms" y "bathrooms" son conteos totales (números enteros)
- Si el plano no tiene escala legible, estima las dimensiones basado en proporciones típicas`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude no devolvió JSON válido del plano')

  return JSON.parse(jsonMatch[0]) as FloorPlanAnalysis
}

/**
 * Analyzes a photo of a room and extracts visible items/furniture.
 * Used during the onboarding chat when an owner uploads a room photo.
 */
export async function analyzeRoomPhoto(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  spaceType: string,
  nokStandardsContext: string
): Promise<{
  space: string
  items_found: string[]
  items_missing: string[]
  items_not_nok: string[]
  observations: string
}> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Eres el asistente de onboarding de NOK, empresa de gestión de apartamentos de corto plazo.

El propietario acaba de subir una foto de su ${spaceType}.

ESTÁNDARES NOK para este espacio:
${nokStandardsContext}

Analiza la foto e identifica qué ítems del estándar NOK están presentes, cuáles faltan y cuáles no cumplen el estándar.

Responde ÚNICAMENTE con JSON válido (sin texto adicional):
{
  "space": "${spaceType}",
  "items_found": ["sofá 3 puestos", "mesa de centro", "TV 55 pulgadas"],
  "items_missing": ["tapete", "solar screen"],
  "items_not_nok": ["sofá de terciopelo (prohibido por NOK)"],
  "observations": "El sofá está en buen estado pero el material no cumple con el estándar NOK de telas de alto tráfico. Falta el tapete bajo las patas posteriores del sofá."
}`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude no devolvió JSON válido del análisis de foto')

  return JSON.parse(jsonMatch[0])
}
