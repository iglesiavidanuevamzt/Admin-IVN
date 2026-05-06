import { isSuperAdmin } from '@/lib/roles';

export function parseInviterEmails(): string[] {
  const raw = process.env.INVITER_EMAILS ?? '';
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function emailMayInvite(email: string | undefined, rol: string | null): boolean {
  if (isSuperAdmin(rol)) return true;
  if (!email) return false;
  const norm = email.trim().toLowerCase();
  return parseInviterEmails().includes(norm);
}
