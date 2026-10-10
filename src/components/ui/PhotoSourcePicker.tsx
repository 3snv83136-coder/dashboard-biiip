"use client";

import { Camera, Images } from "lucide-react";
import { useRef, type ChangeEvent } from "react";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
  /** Images only by default; add video MIME for médias. */
  accept?: string;
  /** Also show camera capture (mobile). */
  showCamera?: boolean;
  libraryLabel?: string;
  cameraLabel?: string;
  className?: string;
  /** Style dashboard (Button-like) vs spectacle/club. */
  variant?: "dashboard" | "plain";
};

const DEFAULT_ACCEPT =
  "image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.tif,.tiff,.jfif";

/**
 * Choix explicite Photothèque (galerie) vs Appareil photo.
 * Sans `capture` sur le 1er input = accès à la photothèque / fichiers.
 */
export function PhotoSourcePicker({
  onFile,
  disabled = false,
  accept = DEFAULT_ACCEPT,
  showCamera = true,
  libraryLabel = "Photothèque",
  cameraLabel = "Prendre une photo",
  className = "",
  variant = "dashboard",
}: Props) {
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onFile(file);
  }

  const btn =
    variant === "dashboard"
      ? "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-medium text-white hover:border-cyan/40 hover:bg-cyan/10 disabled:opacity-50"
      : "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm font-semibold text-white disabled:opacity-50";

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <input
        ref={libraryRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={handleChange}
      />
      {showCamera ? (
        <input
          ref={cameraRef}
          type="file"
          accept="image/*,.heic,.heif"
          capture="environment"
          className="hidden"
          disabled={disabled}
          onChange={handleChange}
        />
      ) : null}

      <button
        type="button"
        className={btn}
        disabled={disabled}
        onClick={() => libraryRef.current?.click()}
      >
        <Images size={16} />
        {libraryLabel}
      </button>
      {showCamera ? (
        <button
          type="button"
          className={btn}
          disabled={disabled}
          onClick={() => cameraRef.current?.click()}
        >
          <Camera size={16} />
          {cameraLabel}
        </button>
      ) : null}
    </div>
  );
}
