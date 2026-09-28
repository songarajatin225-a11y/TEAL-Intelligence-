import clsx from 'clsx';
import { useState } from 'react';
import { assetUrl } from '../utils/paths';

/*
 * TEAL logo — the ORIGINAL logo file only (public/brand/teal-logo.png), never a redraw.
 * If the file is absent or fails to load, a plain text label is shown instead.
 */
export const LOGO_SRC = 'brand/teal-logo.png';
/** Wordmark crop of the same original file (generated pixel-for-pixel, not redrawn) — legible at icon size. */
export const MARK_SRC = 'brand/favicon-192.png';

export function TealLogo({ className, fallbackClassName }: { className?: string; fallbackClassName?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <span className={clsx('font-semibold tracking-[-0.01em] text-ink', fallbackClassName)} aria-label="TEAL">
        TEAL
      </span>
    );
  return <img src={assetUrl(LOGO_SRC)} alt="TEAL — A TATA Enterprise" className={clsx('object-contain', className)} onError={() => setFailed(true)} draggable={false} />;
}

/** Compact logo tile for the collapsed sidebar and the mobile header (same original file). */
export function TealMark({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={clsx('grid shrink-0 place-items-center overflow-hidden rounded-[10px] bg-white ring-1 ring-line-strong', className)}>
      {failed ? <span className="text-[0.6rem] font-bold text-[#0e2028]">TEAL</span> : <img src={assetUrl(MARK_SRC)} alt="TEAL" className="h-full w-full object-contain" onError={() => setFailed(true)} draggable={false} />}
    </span>
  );
}
