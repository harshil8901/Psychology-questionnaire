function getSecret(): string {
  return process.env.ADMIN_SECRET ?? "flourishing-research-panel";
}

export async function getAdminSessionToken(): Promise<string> {
  const data = new TextEncoder().encode(getSecret());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isValidAdminSessionValue(
  value: string | undefined
): Promise<boolean> {
  if (!value) return false;
  const expected = await getAdminSessionToken();
  if (value.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < value.length; i++) {
    diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
