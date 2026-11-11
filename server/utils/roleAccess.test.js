import test from 'node:test';
import assert from 'node:assert/strict';
import { hasAllowedRole } from './roleAccess.js';
import User from '../models/User.model.js';

test('role authorization allows only explicitly listed roles', () => {
  assert.equal(hasAllowedRole('admin', ['admin']), true);
  assert.equal(hasAllowedRole('hr', ['admin', 'hr']), true);
  assert.equal(hasAllowedRole('employee', ['admin', 'hr']), false);
  assert.equal(hasAllowedRole('manager', ['admin', 'hr', 'employee']), false);
});

test('User model only accepts Admin, HR, and Employee roles', () => {
  assert.deepEqual(User.schema.path('role').enumValues, ['admin', 'hr', 'employee']);
});

test('role authorization denies missing or malformed permissions', () => {
  assert.equal(hasAllowedRole('admin', []), false);
  assert.equal(hasAllowedRole('admin', null), false);
  assert.equal(hasAllowedRole(undefined, ['admin']), false);
});
