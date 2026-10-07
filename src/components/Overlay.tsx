import { useEffect, useRef, type ReactNode } from 'react';

/** Modal boundary with Escape, focus containment, scroll lock and focus restoration. */
export function Overlay({ children, onClose, label, className = '' }: { children: ReactNode; onClose: () => void; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const siblings = Array.from(document.getElementById('root')?.children ?? []).flatMap(el => Array.from(el.children)).filter(el => !el.contains(ref.current));
    const inertStates = siblings.map(el => (el as HTMLElement).inert);
    siblings.forEach(el => { (el as HTMLElement).inert = true; });
    const focusable = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []).filter(el => el.getClientRects().length);
    (focusable()[0] ?? ref.current)?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0], last = elements[elements.length - 1];
        if (!first) { event.preventDefault(); ref.current?.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = bodyOverflow;
      siblings.forEach((el, i) => { (el as HTMLElement).inert = inertStates[i]; });
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={className}>{children}</div>;
}
