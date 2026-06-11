const DEFAULT_ALLOWED_DOMAIN = "griff.co.kr";

export function getAllowedEmailDomain() {
  return (
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase() ||
    DEFAULT_ALLOWED_DOMAIN
  );
}

export function isAllowedEmail(email?: string | null) {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const domain = getAllowedEmailDomain();

  return normalizedEmail.endsWith(`@${domain}`);
}
