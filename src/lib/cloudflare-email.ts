import { siteConfig } from '@/config/site';

export type CloudflareEmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
};

export type CloudflareEmailResult = {
  success: boolean;
  error?: string;
  result?: unknown;
};

function env(name: string) {
  return import.meta.env[name] || process.env[name] || '';
}

export async function sendCloudflareEmail(payload: CloudflareEmailPayload): Promise<CloudflareEmailResult> {
  const mailgunApiKey = env('MAILGUN_API_KEY');
  const mailgunDomain = env('MAILGUN_DOMAIN');
  if (mailgunApiKey && mailgunDomain) {
    const mailgunResult = await sendMailgunEmail(payload, mailgunApiKey, mailgunDomain);
    if (mailgunResult.success || env('MAILGUN_DISABLE_FALLBACK') === 'true') return mailgunResult;
  }

  const token = env('CLOUDFLARE_API_TOKEN');
  const accountId = env('CLOUDFLARE_ACCOUNT_ID');
  const from = payload.from || env('MAIL_FROM') || siteConfig.publicEmail;

  if (!token || !accountId) {
    return { success: false, error: 'Cloudflare Email Sending non configurato.' };
  }

  const body: Record<string, unknown> = {
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
  };
  if (payload.html) body.html = payload.html;
  if (payload.replyTo) body.reply_to = payload.replyTo;
  if (payload.cc) body.cc = payload.cc;
  if (payload.bcc) body.bcc = payload.bcc;

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success === false) {
      const message = data?.errors?.map((item: any) => item.message).filter(Boolean).join('; ');
      return { success: false, error: message || `Cloudflare email HTTP ${response.status}` };
    }
    return { success: true, result: data?.result ?? data };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Invio email non riuscito.' };
  }
}

async function sendMailgunEmail(
  payload: CloudflareEmailPayload,
  apiKey: string,
  domain: string
): Promise<CloudflareEmailResult> {
  const baseUrl = env('MAILGUN_BASE_URL') || 'https://api.mailgun.net';
  const from = payload.from || env('MAIL_FROM') || siteConfig.publicEmail;
  const form = new FormData();
  form.set('from', from);
  form.set('to', payload.to);
  form.set('subject', payload.subject);
  form.set('text', payload.text);
  if (payload.html) form.set('html', payload.html);
  if (payload.replyTo) form.set('h:Reply-To', payload.replyTo);
  if (payload.cc) form.set('cc', Array.isArray(payload.cc) ? payload.cc.join(',') : payload.cc);
  if (payload.bcc) form.set('bcc', Array.isArray(payload.bcc) ? payload.bcc.join(',') : payload.bcc);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
      body: form,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { success: false, error: data?.message || data?.error || `Mailgun HTTP ${response.status}`, result: data };
    }
    return { success: true, result: data };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Invio Mailgun non riuscito.' };
  }
}

export function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
