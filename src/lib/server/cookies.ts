import { createHmac, randomUUID, timingSafeEqual } from "crypto";

import type { NextResponse } from "next/server";

import { getCookieSecret } from "@/lib/server/env";

export const OWNER_COOKIE_NAME = "cooking_assistant_guest";

const OWNER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface OwnerContext {
  ownerId: string;
  cookieValue: string;
  isNew: boolean;
}

export function getOrCreateOwnerContext(cookieValue?: string | null): OwnerContext {
  const secret = getCookieSecret();

  if (cookieValue) {
    const verifiedOwnerId = verifySignedOwnerId(cookieValue, secret);
    if (verifiedOwnerId) {
      return {
        ownerId: verifiedOwnerId,
        cookieValue,
        isNew: false,
      };
    }
  }

  const ownerId = randomUUID();
  return {
    ownerId,
    cookieValue: signOwnerId(ownerId, secret),
    isNew: true,
  };
}

export function applyOwnerCookie(response: NextResponse, ownerContext: OwnerContext): void {
  if (!ownerContext.isNew) {
    return;
  }

  response.cookies.set({
    name: OWNER_COOKIE_NAME,
    value: ownerContext.cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OWNER_COOKIE_MAX_AGE_SECONDS,
  });
}

export function signOwnerId(ownerId: string, secret: string): string {
  const payload = Buffer.from(ownerId, "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySignedOwnerId(value: string, secret: string): string | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  return Buffer.from(payload, "base64url").toString("utf8");
}
