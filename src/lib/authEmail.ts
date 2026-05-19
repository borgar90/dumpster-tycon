import nodemailer, { type Transporter } from 'nodemailer';

type AuthEmailResult = {
  delivered: boolean;
  previewUrl?: string;
};

let cachedTransporter: Transporter | null = null;

function getBaseUrl(request: Request) {
  const configured = process.env.NEXTAUTH_URL || process.env.AUTH_URL;
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  return new URL(request.url).origin;
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const from = process.env.EMAIL_FROM;

  if (!host || !port || !from) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: process.env.SMTP_SECURE === 'true' || Number(port) === 465,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  return cachedTransporter;
}

async function sendEmail(args: {
  request: Request;
  to: string;
  subject: string;
  actionPath: string;
  heading: string;
  body: string;
  buttonLabel: string;
}) {
  const previewUrl = `${getBaseUrl(args.request)}${args.actionPath}`;
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM;

  if (!transporter || !from) {
    return {
      delivered: false,
      previewUrl,
    } satisfies AuthEmailResult;
  }

  await transporter.sendMail({
    from,
    to: args.to,
    subject: args.subject,
    text: `${args.heading}\n\n${args.body}\n\n${previewUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#0a0a0a; color:#e5ffe1; padding:24px;">
        <div style="max-width:560px; margin:0 auto; background:#111; border:1px solid rgba(57,255,20,0.2); border-radius:18px; padding:28px;">
          <p style="font-size:11px; letter-spacing:0.35em; text-transform:uppercase; color:#39ff14aa; margin:0 0 16px;">Dumpster Tycoon Security</p>
          <h1 style="font-size:26px; margin:0 0 14px; color:#e5ffe1;">${args.heading}</h1>
          <p style="font-size:14px; line-height:1.6; color:#cbd5e1; margin:0 0 24px;">${args.body}</p>
          <a href="${previewUrl}" style="display:inline-block; padding:12px 18px; border-radius:999px; background:#39ff1418; border:1px solid rgba(57,255,20,0.35); color:#39ff14; text-decoration:none; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; font-size:12px;">
            ${args.buttonLabel}
          </a>
          <p style="font-size:12px; line-height:1.6; color:#94a3b8; margin:24px 0 0;">If the button does not work, copy and paste this link into your browser:<br />${previewUrl}</p>
        </div>
      </div>
    `,
  });

  return {
    delivered: true,
    previewUrl: process.env.NODE_ENV === 'production' ? undefined : previewUrl,
  } satisfies AuthEmailResult;
}

export async function sendVerificationEmail(args: {
  request: Request;
  to: string;
  token: string;
}) {
  return sendEmail({
    request: args.request,
    to: args.to,
    subject: 'Verify your Dumpster Tycoon email',
    actionPath: `/api/auth/verify-email?token=${args.token}`,
    heading: 'Verify your scavenger account',
    body: 'Confirm this email address to unlock password sign-in and account recovery.',
    buttonLabel: 'Verify Email',
  });
}

export async function sendPasswordResetEmail(args: {
  request: Request;
  to: string;
  token: string;
}) {
  return sendEmail({
    request: args.request,
    to: args.to,
    subject: 'Reset your Dumpster Tycoon password',
    actionPath: `/?resetToken=${args.token}`,
    heading: 'Reset your password',
    body: 'Use this secure link to set a new password for your Dumpster Tycoon account. The link expires in one hour.',
    buttonLabel: 'Reset Password',
  });
}