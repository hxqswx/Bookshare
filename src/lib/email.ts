import { Resend } from "resend";

/** True only when RESEND_API_KEY is present — used to skip verification gracefully */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM =
  process.env.RESEND_FROM ?? "我们真的爱读书 <noreply@wezhendeaishu.com>";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const url = `${APP_URL}/api/verify-email?token=${token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "请验证您的邮箱 / Verify your email",
    html: buildHtml(name, url),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

function buildHtml(name: string, url: string): string {
  return `<!DOCTYPE html>
<html lang="zh">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#FFFDF9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFDF9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#fff;border-radius:24px;border:1px solid #f0ebe0;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2d5a27 0%,#4a7c3f 100%);padding:36px 40px;text-align:center;">
            <div style="font-size:48px;line-height:1;margin-bottom:12px;">📚</div>
            <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">我们真的爱读书</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1a2e1a;">你好，${escapeHtml(name)}！</p>
            <p style="margin:0 0 24px;font-size:14px;color:#666;line-height:1.7;">
              感谢您注册我们真的爱读书。请点击下方按钮验证您的邮箱地址，即可开始与书友交流、分享阅读心得。
            </p>
            <p style="margin:0 0 24px;font-size:13px;color:#999;line-height:1.6;">
              Thank you for registering. Click below to verify your email address and start exploring.
            </p>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 32px;">
                  <a href="${url}"
                     style="display:inline-block;background:#e85d04;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:14px;letter-spacing:0.2px;">
                    ✉️ 验证邮箱 / Verify Email
                  </a>
                </td>
              </tr>
            </table>

            <!-- Expiry note -->
            <div style="background:#f9f6f0;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
                🕐 此链接将在 <strong>24 小时</strong>后失效。<br/>
                This link expires in <strong>24 hours</strong>.<br/>
                如果不是您注册的，请忽略此邮件。If you didn't register, please ignore this email.
              </p>
            </div>

            <!-- Fallback URL -->
            <p style="margin:0;font-size:11px;color:#bbb;line-height:1.6;word-break:break-all;">
              如果按钮无法点击，请将以下地址复制到浏览器：<br/>
              <a href="${url}" style="color:#e85d04;">${url}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0ebe0;text-align:center;">
            <p style="margin:0;font-size:11px;color:#ccc;">
              © 我们真的爱读书 · 书香社区
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
