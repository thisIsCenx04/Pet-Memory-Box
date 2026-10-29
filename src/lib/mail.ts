import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";

// Gửi email qua SMTP (Gmail, Zoho, Resend SMTP…). Khi phát triển: MAIL_DRIVER=console in ra log,
// MAIL_DRIVER=file ghi vào .local-outbox/mail.jsonl để kiểm thử đọc lại.

export type Mail = { to: string; subject: string; text: string; html?: string };

function driver(): "smtp" | "console" | "file" {
  const forced = process.env.MAIL_DRIVER;
  if (forced === "smtp" || forced === "console" || forced === "file") return forced;
  return process.env.SMTP_HOST ? "smtp" : "console";
}

export function mailConfigured(): boolean {
  return driver() !== "console" || process.env.NODE_ENV !== "production";
}

let transporter: Transporter | null = null;

function smtp(): Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export const OUTBOX = path.join(process.cwd(), ".local-outbox", "mail.jsonl");

/** Gửi email; lỗi được ghi log và trả về false thay vì làm hỏng thao tác chính. */
export async function sendMail(mail: Mail): Promise<boolean> {
  try {
    const d = driver();
    if (d === "smtp") {
      await smtp().sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html ?? layout(mail.subject, mail.text),
      });
    } else if (d === "file") {
      await mkdir(path.dirname(OUTBOX), { recursive: true });
      await appendFile(OUTBOX, JSON.stringify({ ...mail, at: new Date().toISOString() }) + "\n");
    } else {
      console.info(`[mail] to=${mail.to} subject=${mail.subject}\n${mail.text}`);
    }
    return true;
  } catch (e) {
    console.error("mail_send_failed", mail.to, mail.subject, e);
    return false;
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Khung email tông be của Furever; đường dẫn trong nội dung được biến thành link. */
export function layout(title: string, text: string): string {
  const body = escapeHtml(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#45583c">$1</a>')
    .replace(/\n/g, "<br>");
  return `<!doctype html><html lang="vi"><body style="margin:0;background:#f6efe4;font-family:Arial,Helvetica,sans-serif;color:#3f3329">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#fbf8f2;border:1px solid #ece2d1;border-radius:16px">
<tr><td style="padding:24px 28px 8px;font-weight:bold;letter-spacing:2px;font-size:13px;color:#6b5c4e">FUREVER · PET MEMORY BOX</td></tr>
<tr><td style="padding:0 28px;font-size:20px;font-weight:bold">${escapeHtml(title)}</td></tr>
<tr><td style="padding:16px 28px 28px;font-size:15px;line-height:1.6">${body}</td></tr>
</table>
<p style="font-size:12px;color:#6b5c4e;margin-top:16px">Vì tình yêu thương luôn tồn tại, theo một cách khác.</p>
</td></tr></table></body></html>`;
}
