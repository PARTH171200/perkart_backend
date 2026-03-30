const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── OTP Email ──────────────────────────────────────────────
async function sendOtpEmail(toEmail, otp) {
  await transporter.sendMail({
    from: `"Perkart" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Your Perkart Password Reset OTP",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#000;color:#fff;border-radius:16px;">
        <h2 style="margin-bottom:8px;">Reset Your Password</h2>
        <p style="color:#aaa;">This OTP expires in 10 minutes.</p>
        <div style="font-size:48px;font-weight:700;letter-spacing:14px;text-align:center;padding:28px 0;">
          ${otp}
        </div>
        <p style="color:#555;font-size:13px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

// ── Enterprise Inquiry Email ───────────────────────────────
async function sendEnterpriseEmail({ name, email, company, message }) {
  const toEmail = process.env.ENTERPRISE_EMAIL || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"Perkart App" <${process.env.SMTP_USER}>`,
    to: toEmail,
    replyTo: email,   // reply goes directly to the person who inquired
    subject: `Enterprise Inquiry — ${company}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#000;color:#fff;border-radius:16px;">
        <h2 style="margin-bottom:4px;">New Enterprise Inquiry 🏢</h2>
        <p style="color:#555;font-size:13px;margin-bottom:28px;">Received via Perkart app</p>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#777;font-size:13px;padding:10px 0;border-bottom:1px solid #1a1a1a;width:100px;">Name</td>
            <td style="color:#fff;font-size:14px;padding:10px 0;border-bottom:1px solid #1a1a1a;">${name}</td>
          </tr>
          <tr>
            <td style="color:#777;font-size:13px;padding:10px 0;border-bottom:1px solid #1a1a1a;">Email</td>
            <td style="color:#fff;font-size:14px;padding:10px 0;border-bottom:1px solid #1a1a1a;">
              <a href="mailto:${email}" style="color:#60A5FA;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="color:#777;font-size:13px;padding:10px 0;border-bottom:1px solid #1a1a1a;">Company</td>
            <td style="color:#fff;font-size:14px;padding:10px 0;border-bottom:1px solid #1a1a1a;">${company}</td>
          </tr>
          <tr>
            <td style="color:#777;font-size:13px;padding:10px 0;vertical-align:top;">Message</td>
            <td style="color:#aaa;font-size:14px;padding:10px 0;line-height:1.6;">
              ${message || "<em style='color:#444'>No message provided</em>"}
            </td>
          </tr>
        </table>

        <a href="mailto:${email}" style="display:inline-block;margin-top:28px;padding:14px 28px;background:#fff;color:#000;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;">
          Reply to ${name} →
        </a>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail, sendEnterpriseEmail };