/** Tên miền gốc của mọi đường dẫn công khai và QR (FR-37). */
export function siteUrl(): string {
  const url = process.env.SITE_URL;
  if (!url) throw new Error("SITE_URL chưa được cấu hình");
  return url.replace(/\/+$/, "");
}

export function publicPetUrl(token: string): string {
  return `${siteUrl()}/p/${token}`;
}
