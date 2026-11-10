const decodeBase64 = (value) => {
  const normalized = value.replace(/\s+/g, '');
  if (!normalized || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 is not valid Base64');
  }

  return Buffer.from(normalized, 'base64').toString('utf8');
};

export const readFirebaseServiceAccount = ({ json, base64 }) => {
  const rawJson = json?.trim();
  const encodedJson = base64?.trim();

  if (rawJson && encodedJson) {
    throw new Error('Set only one Firebase service-account environment variable');
  }
  if (!rawJson && !encodedJson) return null;

  const source = encodedJson ? decodeBase64(encodedJson) : rawJson;
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(source);
  } catch {
    throw new Error('Firebase service-account value must contain valid JSON');
  }

  if (
    !serviceAccount
    || typeof serviceAccount !== 'object'
    || typeof serviceAccount.project_id !== 'string'
    || typeof serviceAccount.client_email !== 'string'
    || typeof serviceAccount.private_key !== 'string'
  ) {
    throw new Error('Firebase service-account JSON is missing required fields');
  }

  return serviceAccount;
};
