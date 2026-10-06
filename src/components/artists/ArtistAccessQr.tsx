"use client";

import { Button } from "@/components/ui/Button";
import { Copy, Download, Printer, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR d’accès fiche artiste (scan → /ma-fiche?code=…). */
export function ArtistAccessQr({
  stageName,
  portalUrlWithCode,
}: {
  stageName: string;
  portalUrlWithCode: string;
}) {
  const [dataUrl, setDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!portalUrlWithCode) {
      setDataUrl("");
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(portalUrlWithCode, {
      width: 512,
      margin: 2,
      color: { dark: "#04131f", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [portalUrlWithCode]);

  async function copyLink() {
    await navigator.clipboard.writeText(portalUrlWithCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadPng() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `biiip-fiche-${stageName.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  }

  function printQr() {
    if (!dataUrl) return;
    const w = window.open("", "_blank", "noopener,noreferrer,width=480,height=700");
    if (!w) return;
    const safeName = stageName.replace(/[<>&"]/g, "");
    w.document.write(`<!doctype html><html><head><title>QR fiche ${safeName}</title>
<style>
  body{font-family:system-ui,sans-serif;text-align:center;padding:32px;color:#04131f}
  h1{font-size:22px;margin:0 0 6px}
  h2{font-size:18px;margin:0 0 16px;color:#19b2ea}
  p{font-size:13px;color:#445;margin:0 0 16px;word-break:break-all}
  img{width:280px;height:280px}
</style></head><body>
  <h1>Biiip Comedy Club</h1>
  <h2>${safeName}</h2>
  <p>Scanne pour remplir ta fiche artiste</p>
  <img src="${dataUrl}" alt="QR fiche" />
  <p>${portalUrlWithCode}</p>
  <script>window.onload=()=>{window.print();}</script>
</body></html>`);
    w.document.close();
  }

  if (!portalUrlWithCode) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 p-4 text-sm text-muted">
        <QrCode size={28} />
        Crée le code pour afficher le QR à flasher sur place.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="mx-auto shrink-0 rounded-2xl bg-white p-3 sm:mx-0">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`QR fiche ${stageName}`}
            className="h-44 w-44"
          />
        ) : (
          <div className="flex h-44 w-44 items-center justify-center text-muted">
            <QrCode size={36} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <p className="text-sm text-muted">
          L’artiste flash ce QR → ouverture directe de sa fiche (sans taper le
          code). Idéal pour une première venue sur place.
        </p>
        <p className="truncate rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-cyan">
          {portalUrlWithCode}
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
        </div>
      </div>
    </div>
  );
}
