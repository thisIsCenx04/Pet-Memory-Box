// Sinh nội dung mã VietQR (chuẩn EMVCo của NAPAS) cho chuyển khoản tới tài khoản ngân hàng.
// Mã động kèm số tiền và nội dung, quét bằng mọi app ngân hàng tại Việt Nam.

function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** CRC-16/CCITT-FALSE (đa thức 0x1021, giá trị đầu 0xFFFF), theo yêu cầu của EMVCo. */
export function crc16(input: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(input)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Bỏ dấu và ký tự đặc biệt: nhiều ngân hàng chỉ nhận chữ, số và khoảng trắng trong nội dung. */
export function toTransferText(text: string, max = 50): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export type VietQrInput = {
  bankBin: string; // ví dụ 970436 (Vietcombank)
  accountNumber: string;
  amount?: number | null; // VND
  description?: string | null;
};

export function buildVietQrPayload({ bankBin, accountNumber, amount, description }: VietQrInput): string {
  const beneficiary = tlv("00", bankBin) + tlv("01", accountNumber);
  const merchant = tlv("00", "A000000727") + tlv("01", beneficiary) + tlv("02", "QRIBFTTA");
  const dynamic = !!amount || !!description;
  let body =
    tlv("00", "01") +
    tlv("01", dynamic ? "12" : "11") +
    tlv("38", merchant) +
    tlv("53", "704") +
    (amount ? tlv("54", String(Math.round(amount))) : "") +
    tlv("58", "VN");
  const purpose = description ? toTransferText(description) : "";
  if (purpose) body += tlv("62", tlv("08", purpose));
  body += "6304";
  return body + crc16(body);
}

export const BANKS: Record<string, string> = {
  "970436": "Vietcombank",
  "970415": "VietinBank",
  "970418": "BIDV",
  "970405": "Agribank",
  "970407": "Techcombank",
  "970422": "MB Bank",
  "970416": "ACB",
  "970432": "VPBank",
  "970423": "TPBank",
  "970403": "Sacombank",
};
