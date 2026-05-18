import { ACCESS_MODULES } from '@/lib/access/modules';
import { ADMIN_ROLE, parseRoles, SUPER_ADMIN_ROLE } from '@/lib/roles';

export const DEFAULT_BOOTSTRAP_ROLE = 'visitante';

const MODULE_ROLE_IDS = new Set(ACCESS_MODULES.map((m) => m.roleId));

/** Roles que un usuario NUNCA puede auto-asignarse en registro o bootstrap público. */
const PRIVILEGED_ROLES = new Set([
  SUPER_ADMIN_ROLE,
  ADMIN_ROLE,
  ...MODULE_ROLE_IDS,
  'devocionales',
  'avisos',
  'calendario',
  'encargado',
  'biblias',
]);

export function isInvitedAuthUser(user: {
  invited_at?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): boolean {
  if (user.invited_at) return true;
  if (user.user_metadata?.invited_by_ivn === true) return true;
  if (user.app_metadata?.invited_by_ivn === true) return true;
  return false;
}

/**
 * Roles permitidos al crear perfil desde el cliente (registro / primer acceso).
 * Solo visitante; módulos, admin y super-admin solo vía /admin/usuarios (service role).
 */
export function sanitizeSelfServiceBootstrapRoles(rolesInput: string[] | null | undefined): string[] {
  const parsed = parseRoles(rolesInput);
  const withoutPrivileged = parsed.filter((r) => !PRIVILEGED_ROLES.has(r));
  if (withoutPrivileged.length > 0) {
    return [...new Set(withoutPrivileged)];
  }
  return [DEFAULT_BOOTSTRAP_ROLE];
}
