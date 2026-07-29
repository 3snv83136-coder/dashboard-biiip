export type ParsedArtistLine = {
  stage_name: string;
  phone: string;
  legal_name: string;
};

/** Parse une liste collée depuis WhatsApp (participants ou export). */
export function parseWhatsAppArtistList(raw: string): ParsedArtistLine[] {
  const seen = new Set<string>();
  const results: ParsedArtistLine[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const cleaned = cleanLine(line);
    if (!cleaned) continue;

    const key = cleaned.stage_name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(cleaned);
  }

  return results;
}

function cleanLine(line: string): ParsedArtistLine | null {
  let text = line.trim();
  if (!text) return null;

  // Lignes d'export chat : [29/07/2026, 20:31:12] Nom: message
  const exportMatch = text.match(
    /^\[?\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?\]?\s*([^:]+):\s*/
  );
  if (exportMatch) {
    text = exportMatch[1].trim();
  }

  // Préfixes groupes / système
  if (
    /^(messages et appels|ce message|you created|vous avez|les messages)/i.test(
      text
    )
  ) {
    return null;
  }

  // Enlever puces / numéros de liste
  text = text.replace(/^[-•*\d.)\]]+\s*/, "").trim();
  if (!text || text.length < 2) return null;

  const phoneMatch = text.match(
    /(\+?\d[\d\s().-]{7,}\d)/
  );
  const phone = phoneMatch ? normalizePhone(phoneMatch[1]) : "";

  let name = text;
  if (phoneMatch) {
    name = text.replace(phoneMatch[0], "").trim();
    name = name.replace(/[\s,;|/\\-]+$/g, "").trim();
  }

  // Si la ligne n'est qu'un numéro
  if (!name && phone) {
    return {
      stage_name: phone,
      phone,
      legal_name: "",
    };
  }

  if (!name || name.length < 2) return null;
  // Ignorer les lignes trop longues (probablement un message)
  if (name.length > 80) return null;

  return {
    stage_name: name,
    phone,
    legal_name: name,
  };
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.length === 10) {
    return `+33${digits.slice(1)}`;
  }
  return digits.startsWith("+") ? digits : digits;
}
