type VerifyEmailParams = {
  userName: string;
  verificationUrl: string;
};

export function getVerifyEmailHtml({
  userName,
  verificationUrl,
}: VerifyEmailParams): string {
  const firstName = userName.split(" ")[0];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#c2690a 0%,#e8913a 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">TripLoom</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 16px;">
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#2d2015;letter-spacing:-0.3px;">
                Verify your email
              </h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#6b5d4f;">
                Hey ${firstName}, thanks for joining TripLoom! Tap the button below to confirm your email address.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${verificationUrl}" target="_blank" style="display:inline-block;background-color:#c2690a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                      Verify email address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#9b8e80;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;line-height:1.5;color:#c2690a;word-break:break-all;">
                ${verificationUrl}
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #ebe5de;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9b8e80;">
                If you didn't create a TripLoom account, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
