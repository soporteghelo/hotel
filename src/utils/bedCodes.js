/**
 * Bed code utilities
 * Format: {hotelCodigo}-{piso:2d}-{cuartoNum:2d}-C{camarote}-{INF|SUP}
 * Example: A-03-12-C1-INF
 */

export function generateBedCode(hotelCodigo, piso, cuartoNum, camarote, nivel) {
  const pisoStr = String(piso).padStart(2, '0');
  const cuartoStr = String(cuartoNum).padStart(2, '0');
  return `${hotelCodigo}-${pisoStr}-${cuartoStr}-C${camarote}-${nivel}`;
}

export function parseBedCode(code) {
  if (!code) return null;
  const parts = code.split('-');
  if (parts.length < 5) return null;
  return {
    hotel: parts[0],
    piso: parseInt(parts[1], 10),
    cuarto: parseInt(parts[2], 10),
    camarote: parts[3].replace('C', ''),
    nivel: parts[4],
  };
}

export function getBedLabel(nivel) {
  return nivel === 'INF' ? 'Inferior' : 'Superior';
}

export function getCamaroteLabel(camarote) {
  return `Camarote ${camarote}`;
}

export function getFullBedDescription(code) {
  const parsed = parseBedCode(code);
  if (!parsed) return code;
  return `Piso ${parsed.piso} - Cuarto ${String(parsed.cuarto).padStart(2, '0')} - Camarote ${parsed.camarote} - Cama ${getBedLabel(parsed.nivel)}`;
}
