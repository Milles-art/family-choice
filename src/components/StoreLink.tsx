import type { AnchorHTMLAttributes } from 'react';
import type { Page } from '../types';
import { pageUrl } from '../routing';
import { useStore } from '../store';
export function StoreLink({ to, onClick, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: Page }) {
  const { navigate } = useStore();
  return <a {...props} href={pageUrl(to)} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank' || props.download) return;
    onClick?.(event);
    if (!event.defaultPrevented) { event.preventDefault(); navigate(to); }
  }}>{children}</a>;
}
