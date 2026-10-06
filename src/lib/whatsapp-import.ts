export type ParsedArtistContact = {
  stage_name: string;
  legal_name: string;
  phone: string;
  email: string;
  address_line: string;
  postal_code: string;
  city: string;
};

/**
 * Parse une liste collée (WhatsApp, SMS, OCR Capture Live Text).
 * - un contact par ligne, ou
 * - blocs séparés par une ligne vide (nom / tél / adresse / CP ville)
 */
export function parseWhatsAppArtistList(raw: string): ParsedArtistContact[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const blocks = text.includes("\n\n")
    ? text.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean)
    : null;

  const results: ParsedArtistContact[] = [];
  const seen = new Set<string>();

  if (blocks && blocks.length > 1) {
    for (const block of blocks) {
      const row = parseBlock(block);
      if (!row) continue;
      const key = row.stage_name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(row);
    }
    if (results.length) return results;
  }

  for (const line of text.split("\n")) {
    const row = parseSingleLine(line);
    if (!row) continue;
    const key = row.stage_name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(row);
  }
  return results;
}

function parseBlock(block: string): ParsedArtistContact | null {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) =>
      l
        .replace(/^(adresse|address|ville|tel|tél|telephone|téléphone|email|mail)\s*[:：-]\s*/i, "")
        .trim()
    );

  if (!lines.length) return null;

  let phone = "";
  let email = "";
  let address_line = "";
  let postal_code = "";
  let city = "";
  const nameParts: string[] = [];

  for (const line of lines) {
    if (/^(messages et appels|ce message|you created|vous avez)/i.test(line)) {
      continue;
    }

    const emailMatch = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (emailMatch && !email) {
      email = emailMatch[0].toLowerCase();
      const rest = line.replace(emailMatch[0], "").trim();
      if (rest) nameParts.push(rest);
      continue;
    }

    const phoneMatch = line.match(/(\+?\d[\d\s().-]{7,}\d)/);
    if (phoneMatch && looksLikePhone(phoneMatch[1]) && !phone) {
      phone = normalizePhone(phoneMatch[1]);
      const rest = line.replace(phoneMatch[0], "").trim().replace(/[\s,;|/\\-]+$/g, "");
      if (rest && rest.length < 80) nameParts.push(rest);
      continue;
    }

    const cpCity = line.match(/\b(\d{5})\s+([A-Za-zÀ-ÿ'’\-\s]{2,60})\b/);
    if (cpCity) {
      postal_code = cpCity[1];
      city = titleCase(cpCity[2].trim());
      const before = line.slice(0, cpCity.index).trim().replace(/[,\s]+$/g, "");
      if (before && !address_line) address_line = before;
      continue;
    }

    if (/^\d{5}$/.test(line)) {
      postal_code = line;
      continue;
    }

    // Ligne type adresse (numéro + rue…)
    if (
      /^\d{1,4}\s/.test(line) ||
      /\b(rue|av\.?|avenue|bd\.?|boulevard|chemin|impasse|place|allée|allee|route|cours)\b/i.test(
        line
      )
    ) {
      if (!address_line) address_line = line;
      else address_line = `${address_line}, ${line}`;
      continue;
    }

    if (line.length <= 80) nameParts.push(line);
  }

  const stage_name = (nameParts[0] || phone || email || "").trim();
  if (!stage_name || stage_name.length < 2) return null;

  // Si pas de ville mais 2e ligne courte = ville
  if (!city && nameParts[1] && nameParts[1].length < 40 && !/\d/.test(nameParts[1])) {
    city = titleCase(nameParts[1]);
  }

  return {
    stage_name,
    legal_name: stage_name,
    phone,
    email,
    address_line,
    postal_code,
    city,
  };
}

function parseSingleLine(line: string): ParsedArtistContact | null {
  let text = line.trim();
  if (!text) return null;

  const exportMatch = text.match(
    /^\[?\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?\]?\s*([^:]+):\s*/
  );
  if (exportMatch) {
    text = exportMatch[1].trim();
  }

  if (
    /^(messages et appels|ce message|you created|vous avez|les messages)/i.test(
      text
    )
  ) {
    return null;
  }

  text = text.replace(/^[-•*\d.)\]]+\s*/, "").trim();
  if (!text || text.length < 2) return null;

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const email = emailMatch ? emailMatch[0].toLowerCase() : "";
  if (emailMatch) text = text.replace(emailMatch[0], " ").trim();

  const phoneMatch = text.match(/(\+?\d[\d\s().-]{7,}\d)/);
  const phone = phoneMatch && looksLikePhone(phoneMatch[1])
    ? normalizePhone(phoneMatch[1])
    : "";
  if (phoneMatch) text = text.replace(phoneMatch[0], " ").trim();

  let postal_code = "";
  let city = "";
  let address_line = "";
  const cpCity = text.match(/\b(\d{5})\s+([A-Za-zÀ-ÿ'’\-\s]{2,40})\b/);
  if (cpCity) {
    postal_code = cpCity[1];
    city = titleCase(cpCity[2].trim());
    const before = text.slice(0, cpCity.index!).trim().replace(/[,\s]+$/g, "");
    const after = text.slice((cpCity.index || 0) + cpCity[0].length).trim();
    text = [before, after].filter(Boolean).join(" ").trim();
  }

  // "12 rue X, Toulon" sans CP
  const street = text.match(
    /\b(\d{1,4}\s+(?:rue|av\.?|avenue|bd\.?|boulevard|chemin|impasse|place|allée|allee|route|cours)\b[^,]*)/i
  );
  if (street) {
    address_line = street[1].trim();
    text = text.replace(street[0], " ").replace(/,\s*,/g, ",").trim();
  }

  let name = text
    .replace(/[\s,;|/\\-]+$/g, "")
    .replace(/^[\s,;|/\\-]+/g, "")
    .trim();

  if (!name && phone) {
    return {
      stage_name: phone,
      legal_name: "",
      phone,
      email,
      address_line,
      postal_code,
      city,
    };
  }

  if (!name || name.length < 2) return null;
  if (name.length > 80) return null;

  return {
    stage_name: name,
    legal_name: name,
    phone,
    email,
    address_line,
    postal_code,
    city,
  };
}

function looksLikePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.replace(/\D/g, "").length === 10) {
    return `+33${digits.replace(/\D/g, "").slice(1)}`;
  }
  return digits.startsWith("+") ? digits : digits;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
