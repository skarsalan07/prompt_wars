import { describe, expect, it } from "vitest";

import { signOwnerId, verifySignedOwnerId } from "@/lib/server/cookies";

describe("owner cookie signing", () => {
  it("signs and verifies owner ids", () => {
    const signed = signOwnerId("owner-123", "super-secret");

    expect(verifySignedOwnerId(signed, "super-secret")).toBe("owner-123");
    expect(verifySignedOwnerId(signed, "wrong-secret")).toBeNull();
  });
});
