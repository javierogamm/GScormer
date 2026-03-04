import { createHmac, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE_NAME = 'gscormer_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-session-secret';

const toBase64Url = (value) => Buffer.from(value).toString('base64url');
const fromBase64Url = (value) => Buffer.from(value, 'base64url').toString('utf8');

const sign = (payload) =>
  createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');

export function createSessionToken(user) {
  const payload = JSON.stringify({ ...user, iat: Date.now() });
  const encodedPayload = toBase64Url(payload);
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function readSessionToken(token) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  const isValidSignature = timingSafeEqual(signatureBuffer, expectedBuffer);
  if (!isValidSignature) {
    return null;
  }

  const parsed = JSON.parse(fromBase64Url(encodedPayload));
  if (!parsed?.id || !parsed?.name) {
    return null;
  }

  return {
    id: Number(parsed.id),
    name: String(parsed.name),
    admin: Boolean(parsed.admin),
    alertador: Boolean(parsed.alertador),
    validador: Boolean(parsed.validador),
  };
}
