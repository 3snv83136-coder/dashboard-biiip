"use client";

import { Button } from "@/components/ui/Button";
import { Copy, Download, Printer, QrCode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

const SOURCES = [
  { id: "qr-salle", label: "Salle" },
  { id: "qr-bar", label: "Bar" },
  { id: "qr-affiche", label: "Affiche" },
] as const;

type SourceId = (typeof SOURCES)[number]["id"];

export function AdhesionQrPanel() {
  const [source, setSource] = useState<SourceId>("qr-salle");
  const [dataUrl, setDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const adhesionUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/adhesion?src=${source}`;
  }, [source]);

  useEffect(() => {
    if (!adhesionUrl) return;
    let cancelled = false;
    void QRCode.toDataURL(adhesionUrl, {
      width: 512,
      margin: 2,
      color: { dark: "#04131f", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [adhesionUrl]);

  async function copyLink() {
    if (!adhesionUrl) return;
    await navigator.clipboard.writeText(adhesionUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadPng() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `biiip-adhesion-${source}.png`;
    a.click();
  }

  function printQr() {
    if (!dataUrl || !adhesionUrl) return;
    const w = window.open("", "_blank", "noopener,noreferrer,width=480,height=640");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>QR Adhésion Biiip</title>
<style>
  body{font-family:system-ui,sans-serif;text-align:center;padding:32px;color:#04131f}
  h1{font-size:22px;margin:0 0 8px}
  p{font-size:13px;color:#445;margin:0 0 20px;word-break:break-all}
  img{width:280px;height:280px}
  .hint{margin-top:18px;font-size:14px}
</style></head><body>
  <h1>Biiip Comedy Club</h1>
  <p>Scanne pour adhérer gratuitement</p>
  <img src="${dataUrl}" alt="QR adhésion" />
  <p class="hint">${adhesionUrl}</p>
  <script>window.onload=()=>{window.print();}</script>
</body></html>`);
    w.document.close();
  }

  return (
    <section className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="mx-auto shrink-0 rounded-2xl bg-white p-3 shadow-cyan sm:mx-0">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt="QR code adhésion Biiip"
            className="h-40 w-40 sm:h-44 sm:w-44"
          />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center text-muted sm:h-44 sm:w-44">
            <QrCode size={36} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <h3 className="font-display text-lg font-semibold">QR code adhésion</h3>
          <p className="mt-1 text-sm text-muted">
            À imprimer pour la salle / le bar. Le scan ouvre le formulaire
            public d’adhésion gratuite.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSource(s.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                source === s.id
                  ? "bg-cyan text-night"
                  : "bg-white/10 text-muted hover:bg-white/15"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className="truncate rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-cyan">
          {adhesionUrl || "…"}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void copyLink()}>
            <Copy size={16} />
            {copied ? "Copié !" : "Copier le lien"}
          </Button>
          <Button variant="secondary" onClick={downloadPng} disabled={!dataUrl}>
            <Download size={16} /> PNG
          </Button>
          <Button onClick={printQr} disabled={!dataUrl}>
            <Printer size={16} /> Imprimer
          </Button>
          <a href={adhesionUrl || "/adhesion"} target="_blank" rel="noopener">
            <Button variant="ghost">Ouvrir la page</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
