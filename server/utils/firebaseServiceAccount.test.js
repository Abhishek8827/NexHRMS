import test from 'node:test';
import assert from 'node:assert/strict';
import { readFirebaseServiceAccount } from './firebaseServiceAccount.js';

const serviceAccountJson = JSON.stringify({
  type: 'service_account',
  project_id: 'nexhrms-test',
  client_email: 'firebase-admin@nexhrms-test.iam.gserviceaccount.com',
  private_key: 'test-private-key',
});

test('reads the service-account JSON value', () => {
  const account = readFirebaseServiceAccount({ json: serviceAccountJson });
  assert.equal(account.project_id, 'nexhrms-test');
});

test('decodes a Base64 service-account JSON value', () => {
  const base64 = Buffer.from(serviceAccountJson, 'utf8').toString('base64');
  const account = readFirebaseServiceAccount({ base64 });
  assert.equal(account.project_id, 'nexhrms-test');
});

test('returns null when no service-account value is supplied', () => {
  assert.equal(readFirebaseServiceAccount({}), null);
});

test('rejects conflicting, malformed, and incomplete credentials', () => {
  assert.throws(
    () => readFirebaseServiceAccount({ json: serviceAccountJson, base64: 'e30=' }),
    /Set only one/,
  );
  assert.throws(() => readFirebaseServiceAccount({ base64: '%%%not-base64%%%' }), /Base64/);
  assert.throws(() => readFirebaseServiceAccount({ json: '{bad json' }), /valid JSON/);
  assert.throws(() => readFirebaseServiceAccount({ json: JSON.stringify({ project_id: 'only-id' }) }), /missing required fields/);
});
