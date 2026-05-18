/** Navegadores embebidos (WhatsApp, Instagram, Facebook…) suelen romper cookies o consumir el enlace en vista previa. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /WhatsApp|Instagram|FBAN|FBAV|Line\/|MicroMessenger|Twitter/i.test(ua);
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}
