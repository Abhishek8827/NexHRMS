import test from 'node:test';
import assert from 'node:assert/strict';
import { hasAllowedRole } from './roleAccess.js';

test('role authorization allows only explicitly listed roles', () => {
  assert.equal(hasAllowedRole('admin', ['admin']), true);
  assert.equal(hasAllowedRole('hr', ['admin', 'hr']), true);
  assert.equal(hasAllowedRole('employee', ['admin', 'hr']), false);
});

test('role authorization denies missing or malformed permissions', () => {
  assert.equal(hasAllowedRole('admin', []), false);
  assert.equal(hasAllowedRole('admin', null), false);
  assert.equal(hasAllowedRole(undefined, ['admin']), false);
});
