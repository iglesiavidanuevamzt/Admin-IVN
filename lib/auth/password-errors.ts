/** Supabase: la contraseña nueva es igual a la que ya tiene el usuario. */
export function isSamePasswordError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('different from the old') ||
    m.includes('should be different') ||
    m.includes('diferente de la anterior')
  );
}

export function translateAuthError(message: string): string {
  if (isSamePasswordError(message)) {
    return 'Esa contraseña ya está registrada. Usa otra contraseña nueva o inicia sesión con la que ya creaste.';
  }
  return message;
}
