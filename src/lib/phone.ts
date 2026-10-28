/**
 * Chuẩn hóa số điện thoại Việt Nam về dạng 0xxxxxxxxx (mục 10.2).
 * Trả về null nếu không hợp lệ.
 */
export function normalizeVnPhone(input: string): string | null {
  const digits = input.replace(/[\s.\-()]/g, "");
  let local: string;
  if (digits.startsWith("+84")) local = "0" + digits.slice(3);
  else if (digits.startsWith("84") && digits.length === 11) local = "0" + digits.slice(2);
  else local = digits;
  return /^0\d{9}$/.test(local) ? local : null;
}
