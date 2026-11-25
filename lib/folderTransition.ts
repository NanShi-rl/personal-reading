// Click transition used when opening a reading from the folder stack.
// 1. A full-screen layer in the folder's colour grows out of the clicked tab/card.
// 2. We navigate. The note page picks the colour up from sessionStorage and "lifts"
//    its own curtain, then the folder cover swings open (see globals.css).
//
// Everything is skipped for users who prefer reduced motion.

export const FOLDER_CURTAIN_KEY = 'folderCurtainColor';
export const FOLDER_OVERLAY_ID = 'folder-transition-overlay';

interface RouterLike {
  push: (href: string) => void;
}

export function openWithFolderTransition(router: RouterLike, href: string, color: string, from: DOMRect) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    router.push(href);
    return;
  }

  document.getElementById(FOLDER_OVERLAY_ID)?.remove();

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const overlay = document.createElement('div');
  overlay.id = FOLDER_OVERLAY_ID;
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:100',
    'pointer-events:all',
    `background:${color}`,
    `clip-path:inset(${Math.max(from.top, 0)}px ${Math.max(vw - from.right, 0)}px ${Math.max(vh - from.bottom, 0)}px ${Math.max(from.left, 0)}px round 4px)`,
    'transition:clip-path .55s cubic-bezier(.65,0,.35,1)',
  ].join(';');
  document.body.appendChild(overlay);

  // Force a layout so the transition starts from the clipped rectangle.
  void overlay.offsetWidth;
  overlay.style.clipPath = 'inset(0px 0px 0px 0px round 0px)';

  try {
    sessionStorage.setItem(FOLDER_CURTAIN_KEY, color);
  } catch {
    /* sessionStorage unavailable: the note page just opens without a curtain */
  }

  window.setTimeout(() => router.push(href), 520);
  // Safety net: never leave an invisible click-blocking overlay behind.
  window.setTimeout(() => document.getElementById(FOLDER_OVERLAY_ID)?.remove(), 4000);
}
