// Lightweight in-page snackbar/toast system (top-right, accumulating)
function ensureToastContainer(): HTMLElement {
  const id = "finest-toast-container";
  let el = document.getElementById(id);
  if (el) return el;
  el = document.createElement("div");
  el.id = id;
  Object.assign(el.style, {
    position: "fixed",
    top: "12px",
    right: "12px",
    zIndex: "2147483647", // on top
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    pointerEvents: "none",
  } as CSSStyleDeclaration);
  document.documentElement.appendChild(el);
  return el;
}

export function addToast(opts: { message: string; duration?: number; type?: 'error' | 'success' }) {
  const { message, duration = 4000, type = 'error' } = opts;
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  
  // Define styling based on type
  const isError = type === 'error';
  const borderColor = isError ? '#fb8181' : '#e5e7eb';
  const backgroundColor = isError ? '#ffffff' : '#1f2937';
  const textColor = isError ? '#C2231F' : '#ffffff';
  const iconColor = isError ? '#C2231F' : '#ffffff';
  const progressColor = isError ? '#F47F7D' : '#6b7280';
  
  // Apply styling
  Object.assign(toast.style, {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '12px',
    border: `1.5px solid ${borderColor}`,
    borderRadius: '8px',
    background: backgroundColor,
    color: textColor,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    fontSize: '14px',
    fontWeight: '500',
    width: '320px',
    boxShadow: '0 5px 20px rgb(0 0 0 / 0.1)',
    pointerEvents: 'auto',
    opacity: '0',
    transform: 'translateY(-6px)',
    transition: 'opacity 150ms ease, transform 150ms ease',
  } as CSSStyleDeclaration);

  // Content container (icon + text)
  const contentDiv = document.createElement('div');
  Object.assign(contentDiv.style, {
    display: 'flex',
    gap: '8px',
  } as CSSStyleDeclaration);

  // Icon SVG (info circle for error, checkmark for success)
  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconSvg.setAttribute('fill', 'none');
  iconSvg.setAttribute('viewBox', '0 0 24 24');
  iconSvg.setAttribute('stroke-width', '2');
  iconSvg.setAttribute('stroke', 'currentColor');
  Object.assign(iconSvg.style, {
    height: '16px',
    width: '16px',
    color: iconColor,
    flexShrink: '0',
  } as CSSStyleDeclaration);
  
  const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  iconPath.setAttribute('stroke-linecap', 'round');
  iconPath.setAttribute('stroke-linejoin', 'round');
  
  if (type === 'success') {
    // Checkmark icon
    iconPath.setAttribute('d', 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z');
  } else {
    // Info circle icon (error)
    iconPath.setAttribute('d', 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z');
  }
  
  iconSvg.appendChild(iconPath);
  contentDiv.appendChild(iconSvg);

  // Message text
  const textSpan = document.createElement('span');
  Object.assign(textSpan.style, {
    wordBreak: 'break-word',
  } as CSSStyleDeclaration);
  textSpan.textContent = message;
  contentDiv.appendChild(textSpan);
  
  toast.appendChild(contentDiv);

  // Close button SVG (X)
  const closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  closeSvg.setAttribute('fill', 'none');
  closeSvg.setAttribute('viewBox', '0 0 24 24');
  closeSvg.setAttribute('stroke-width', '2');
  closeSvg.setAttribute('stroke', 'currentColor');
  Object.assign(closeSvg.style, {
    height: '16px',
    width: '16px',
    color: iconColor,
    cursor: 'pointer',
    flexShrink: '0',
  } as CSSStyleDeclaration);

  const closePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  closePath.setAttribute('stroke-linecap', 'round');
  closePath.setAttribute('stroke-linejoin', 'round');
  closePath.setAttribute('d', 'M6 18 18 6M6 6l12 12');
  closeSvg.appendChild(closePath);

  closeSvg.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    cancelTick();
    dismiss();
  });
  toast.appendChild(closeSvg);

  // Progress bar (bottom sliding timer) - matching your style
  const progress = document.createElement('div');
  Object.assign(progress.style, {
    position: 'absolute',
    bottom: '0',
    left: '0',
    height: '2px',
    width: '100%',
    background: progressColor,
  } as CSSStyleDeclaration);
  toast.appendChild(progress);

  container.appendChild(toast);

  // enter animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // auto-dismiss with rAF-driven progress (pauses on hover)
  const total = Math.max(0, duration);
  let remaining = total;
  let endAt = performance.now() + remaining;
  let frameId: number | null = null;

  function tick(now: number) {
    remaining = Math.max(0, endAt - now);
    const pct = total > 0 ? (remaining / total) : 0;
    progress.style.width = `${Math.max(0, Math.min(1, pct)) * 100}%`;
    if (remaining <= 0) {
      dismiss();
      return;
    }
    frameId = requestAnimationFrame(tick);
  }

  function startTick() {
    cancelTick();
    endAt = performance.now() + remaining;
    frameId = requestAnimationFrame(tick);
  }

  function cancelTick() {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  function pauseTick() {
    remaining = Math.max(0, endAt - performance.now());
    cancelTick();
  }

  function dismiss() {
    cancelTick();
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px)';
    window.setTimeout(() => {
      toast.remove();
      if (container.childElementCount === 0) container.remove();
    }, 180);
  }

  // start countdown
  if (total > 0) startTick();

  // allow manual dismiss on click
  // toast.addEventListener('click', () => dismiss());

  // pause/resume on hover
  container.addEventListener('mouseenter', () => pauseTick());
  container.addEventListener('mouseleave', () => startTick());
}