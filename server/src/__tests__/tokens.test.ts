import { describe, it, expect } from "vitest";
import { generateAccessToken, verifyAccessToken } from "../utils/tokens";

describe("tokens utility", () => {
  it("should generate and verify an access token", () => {
    const userId = "user_123";
    const token = generateAccessToken(userId);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(userId);
    expect(decoded).toHaveProperty("iat");
    expect(decoded).toHaveProperty("exp");
  });
});
