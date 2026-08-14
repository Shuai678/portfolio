const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmac(keyValue: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyValue),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return new Uint8Array(signature);
}

export async function hmacHex(keyValue: string, value: string): Promise<string> {
  const signature = await hmac(keyValue, value);
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function signObject(value: unknown, keyValue: string): Promise<string> {
  const encoded = bytesToBase64Url(encoder.encode(JSON.stringify(value)));
  const signature = bytesToBase64Url(await hmac(keyValue, encoded));
  return `${encoded}.${signature}`;
}

export async function verifyObject<T>(token: string, keyValue: string): Promise<T | null> {
  const [encoded, suppliedSignature, extra] = token.split('.');
  if (!encoded || !suppliedSignature || extra) return null;

  const expectedSignature = bytesToBase64Url(await hmac(keyValue, encoded));
  if (expectedSignature.length !== suppliedSignature.length) return null;

  let difference = 0;
  for (let index = 0; index < expectedSignature.length; index += 1) {
    difference |= expectedSignature.charCodeAt(index) ^ suppliedSignature.charCodeAt(index);
  }
  if (difference !== 0) return null;

  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(encoded))) as T;
  } catch {
    return null;
  }
}

export function randomToken(byteLength = 32): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export function readCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get('Cookie');
  if (!cookies) return null;

  for (const part of cookies.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const cookieName = part.slice(0, separator).trim();
    if (cookieName === name) return part.slice(separator + 1).trim();
  }

  return null;
}

export function cookie(
  name: string,
  value: string,
  options: { maxAge: number; path: string; secure: boolean },
): string {
  return [
    `${name}=${value}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
    options.secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}
