export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Dev mode: skip if not configured
    return process.env.NODE_ENV === "development";
  }

  const form = new URLSearchParams({
    secret,
    response: token,
  });
  if (ip) form.append("remoteip", ip);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form }
  );
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
