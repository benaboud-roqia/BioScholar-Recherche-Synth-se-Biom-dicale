import { getAccessToken } from './auth';

/**
 * Encodes string to base64url format required by Gmail API
 */
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Creates RFC 2822 formatted message raw string
 */
function createRawEmail(options: {
  to: string;
  subject: string;
  bodyText: string;
  fromName?: string;
}): string {
  const cleanTo = options.to.trim();
  const cleanSubject = options.subject.replace(/(\r\n|\n|\r)/gm, ' ').trim();

  const lines = [
    `To: ${cleanTo}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(cleanSubject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    options.bodyText,
  ];

  return toBase64Url(lines.join('\r\n'));
}

/**
 * Send an email directly through the user's Gmail account
 */
export async function sendGmailMessage(options: {
  to: string;
  subject: string;
  bodyText: string;
}): Promise<{ id: string; threadId: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Vous devez être connecté avec Google pour utiliser Gmail.');
  }

  const raw = createRawEmail(options);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(
      errorJson.error?.message || `Erreur d'envoi Gmail (${res.status} ${res.statusText})`
    );
  }

  return await res.json();
}

/**
 * Create a draft message in the user's Gmail account
 */
export async function createGmailDraft(options: {
  to: string;
  subject: string;
  bodyText: string;
}): Promise<{ id: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Vous devez être connecté avec Google pour utiliser Gmail.');
  }

  const raw = createRawEmail(options);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: { raw },
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(
      errorJson.error?.message || `Erreur de création de brouillon Gmail (${res.status})`
    );
  }

  return await res.json();
}
