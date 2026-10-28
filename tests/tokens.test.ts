import { describe, expect, it } from "vitest";
import { formatCardNo, generatePublicToken, isPublicTokenFormat } from "@/lib/tokens";

describe("generatePublicToken", () => {
  it("sinh 22 ký tự base62 (NFR-06)", () => {
    for (let i = 0; i < 200; i++) {
      const t = generatePublicToken();
      expect(t).toHaveLength(22);
      expect(isPublicTokenFormat(t)).toBe(true);
    }
  });

  it("không lặp lại", () => {
    const set = new Set(Array.from({ length: 5000 }, () => generatePublicToken()));
    expect(set.size).toBe(5000);
  });

  it("dùng đủ bảng chữ base62", () => {
    const chars = new Set(Array.from({ length: 2000 }, () => generatePublicToken()).join(""));
    expect(chars.size).toBe(62);
  });
});

describe("formatCardNo", () => {
  it("định dạng PMB-xxxxxx", () => {
    expect(formatCardNo(129)).toBe("PMB-000129");
    expect(formatCardNo(BigInt(1))).toBe("PMB-000001");
  });
});

describe("isPublicTokenFormat", () => {
  it("từ chối mã thẻ và chuỗi sai độ dài", () => {
    expect(isPublicTokenFormat("PMB-000129")).toBe(false);
    expect(isPublicTokenFormat("a".repeat(21))).toBe(false);
    expect(isPublicTokenFormat("a".repeat(21) + "-")).toBe(false);
  });
});
