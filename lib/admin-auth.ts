import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-constants";
import {
  getAdminSessionToken,
  isValidAdminSessionValue,
} from "@/lib/admin-session-token";

export { ADMIN_COOKIE } from "@/lib/admin-constants";

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME ?? "phaguni";
  const expectedPass = process.env.ADMIN_PASSWORD ?? "rudhvik2025";

  const userOk = safeEqual(username, expectedUser);
  const passOk = safeEqual(password, expectedPass);
  return userOk && passOk;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  return isValidAdminSessionValue(token);
}

export async function getAdminSessionValue(): Promise<string> {
  return getAdminSessionToken();
}
