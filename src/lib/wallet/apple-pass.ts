import { readFile } from "fs/promises";
import path from "path";
import { PKPass } from "passkit-generator";
import type { Member } from "@/lib/types";
import { formatJoinDate } from "@/lib/club-format";

function envPem(name: string): string {
  const raw = (process.env[name] || "").trim();
  if (!raw) return "";
  // Support PEM brut ou base64 (Vercel)
  if (raw.includes("BEGIN")) return raw.replace(/\\n/g, "\n");
  try {
    return Buffer.from(raw, "base64").toString("utf8");
  } catch {
    return raw;
  }
}

/** True si les certificats Apple Wallet sont configurés. */
export function isAppleWalletConfigured(): boolean {
  return Boolean(
    envPem("APPLE_PASS_WWDR") &&
      envPem("APPLE_PASS_SIGNER_CERT") &&
      envPem("APPLE_PASS_SIGNER_KEY") &&
      (process.env.APPLE_PASS_TYPE_ID || "").trim() &&
      (process.env.APPLE_TEAM_ID || "").trim()
  );
}

async function loadPassImages(): Promise<Record<string, Buffer>> {
  const root = path.join(process.cwd(), "public");
  const icon = await readFile(path.join(root, "icon-192.png"));
  const logo = await readFile(path.join(root, "biiip-logo-neon.png")).catch(
    () => icon
  );
  // Clés construites pour éviter les collisions / parsing de "@2x"
  const retina = "@" + "2x";
  return {
    "icon.png": icon,
    [`icon${retina}.png`]: icon,
    "logo.png": logo,
    [`logo${retina}.png`]: logo,
  };
}

/**
 * Génère un .pkpass Apple Wallet pour un adhérent.
 * Requiert les env APPLE_PASS_* + APPLE_TEAM_ID (voir integrations.md).
 */
export async function buildMemberApplePass(
  member: Member
): Promise<{ buffer: Buffer; filename: string }> {
  if (!isAppleWalletConfigured()) {
    throw new Error(
      "Apple Wallet non configuré (certificats / Pass Type ID manquants)"
    );
  }

  const passTypeIdentifier = process.env.APPLE_PASS_TYPE_ID!.trim();
  const teamIdentifier = process.env.APPLE_TEAM_ID!.trim();
  const organizationName =
    process.env.APPLE_PASS_ORG_NAME?.trim() || "Biiip Comedy Club";
  const memberNumber = member.member_number || member._id;
  const displayName = member.full_name?.trim() || "Adhérent Biiip";
  const since = formatJoinDate(member.joined_at);
  const status =
    member.membership_status === "active" ? "Actif" : "Inactif";

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier,
    serialNumber: `biiip-member-${member._id}`,
    teamIdentifier,
    organizationName,
    description: "Carte d'adhérent Biiip Comedy Club",
    logoText: "Biiip",
    foregroundColor: "rgb(234, 246, 255)",
    backgroundColor: "rgb(11, 17, 28)",
    labelColor: "rgb(25, 178, 234)",
    generic: {
      primaryFields: [
        {
          key: "member_name",
          label: "ADHÉRENT",
          value: displayName,
        },
      ],
      secondaryFields: [
        {
          key: "member_number",
          label: "N° ADHÉRENT",
          value: memberNumber,
        },
      ],
      auxiliaryFields: [
        {
          key: "joined",
          label: "MEMBRE DEPUIS",
          value: since,
        },
        {
          key: "status",
          label: "STATUT",
          value: status,
        },
      ],
      backFields: [
        {
          key: "info",
          label: "Biiip Comedy Club",
          value:
            "Montre cette carte à la buvette. Adhésion gratuite — saison du 1er septembre au 31 août.",
        },
        {
          key: "contact",
          label: "Contact",
          value: "contact@biiipcomedyclub.fr",
        },
      ],
    },
    barcodes: [
      {
        message: memberNumber,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: memberNumber,
      },
    ],
  };

  const images = await loadPassImages();
  const pass = new PKPass(
    {
      ...images,
      "pass.json": Buffer.from(JSON.stringify(passJson), "utf8"),
    },
    {
      wwdr: envPem("APPLE_PASS_WWDR"),
      signerCert: envPem("APPLE_PASS_SIGNER_CERT"),
      signerKey: envPem("APPLE_PASS_SIGNER_KEY"),
      signerKeyPassphrase:
        process.env.APPLE_PASS_SIGNER_PASSPHRASE?.trim() || undefined,
    }
  );

  pass.setBarcodes(memberNumber);

  const safeName = memberNumber.replace(/[^\w.-]+/g, "-");
  return {
    buffer: pass.getAsBuffer(),
    filename: `carte-biiip-${safeName}.pkpass`,
  };
}
