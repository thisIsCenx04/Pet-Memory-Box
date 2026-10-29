import { describe, expect, it } from "vitest";
import { buildVietQrPayload, crc16, toTransferText } from "@/lib/vietqr";

describe("VietQR", () => {
  it("tái tạo đúng mã QR tĩnh của tài khoản nhóm (giải mã từ ảnh Vietcombank)", () => {
    expect(buildVietQrPayload({ bankBin: "970436", accountNumber: "9917624270" })).toBe(
      "00020101021138540010A00000072701240006970436011099176242700208QRIBFTTA53037045802VN6304738A",
    );
  });

  it("mã động có số tiền và nội dung, CRC hợp lệ", () => {
    const p = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "9917624270",
      amount: 450000,
      description: "FUREVER FVK7Q2MD",
    });
    expect(p).toContain("010212");
    expect(p).toContain("5406450000");
    expect(p).toContain("62200816FUREVER FVK7Q2MD");
    expect(crc16(p.slice(0, -4))).toBe(p.slice(-4));
  });

  it("bỏ dấu tiếng Việt trong nội dung chuyển khoản", () => {
    expect(toTransferText("Đặt hộp cho bé Mướp #12")).toBe("Dat hop cho be Muop 12");
  });
});
