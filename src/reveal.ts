/**
 * Scroll-reveal helper. Any element with `data-reveal` fades/slides in when it
 * enters the viewport. A parent with `data-reveal-group` staggers its children.
 * Content stays visible even if observation fails; only intersecting nodes animate.
 * State lives in data attributes (not classes) so React re-renders never wipe it.
 * Does nothing when the visitor prefers reduced motion.
 */
export function initReveal() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      (entry.target as HTMLElement).setAttribute('data-revealed', 'true');
      io.unobserve(entry.target);
    }
  }, { threshold: 0, rootMargin: '0px 0px 40px 0px' });

  const seen = new WeakSet<Element>();
  const scan = () => {
    document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach(group => {
      Array.from(group.children).forEach((child, i) => {
        if (child.hasAttribute('data-reveal')) return;
        child.setAttribute('data-reveal', '');
        (child as HTMLElement).style.setProperty('--reveal-delay', `${Math.min(i, 5) * 45}ms`);
      });
    });
    document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])').forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      io.observe(el);
    });
  };

  scan();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
}
