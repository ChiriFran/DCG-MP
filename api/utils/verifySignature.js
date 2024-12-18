import crypto from 'crypto';

export const verifySignature = (signature, body) => {
  const mpAccessToken = process.env.MP_ACCESS_TOKEN_PROD; // Tu token de acceso de Mercado Pago
  const calculatedSignature = crypto
    .createHmac('sha256', mpAccessToken)
    .update(body)
    .digest('hex');

  return signature === calculatedSignature;
};
