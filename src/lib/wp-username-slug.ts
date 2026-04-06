/** WordPress username fragment from e-mail local-part or similar (matches Google sign-up seeding). */
export function slugifyWpUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}
