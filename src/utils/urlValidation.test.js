import assert from 'node:assert/strict'
import test from 'node:test'
import { parseCsvUrls, readGroup } from './urlValidation.js'

test('readGroup prefers group and falls back to category', () => {
  assert.equal(readGroup({ group: 'bilomax-api', category: 'API' }), 'bilomax-api')
  assert.equal(readGroup({ Group: 'billing' }), 'billing')
  assert.equal(readGroup({ Category: 'General' }), 'General')
  assert.equal(readGroup({ category: '  docs  ' }), 'docs')
  assert.equal(readGroup({}), '')
  assert.equal(readGroup(null), '')
})

test('parseCsvUrls reads a group column', () => {
  const csv = [
    'name,url,group',
    'Health,https://bilomax.com/health,bilomax-api'
  ].join('\n')
  const { rows, errors } = parseCsvUrls(csv)
  assert.deepEqual(errors, [])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].urlName, 'Health')
  assert.equal(rows[0].group, 'bilomax-api')
})

test('parseCsvUrls accepts a legacy category header', () => {
  const csv = [
    'name,url,category',
    'Health,https://bilomax.com/health,bilomax-api'
  ].join('\n')
  const { rows, errors } = parseCsvUrls(csv)
  assert.deepEqual(errors, [])
  assert.equal(rows[0].group, 'bilomax-api')
})

test('parseCsvUrls lets group win when both columns are present', () => {
  const csv = [
    'name,url,category,group',
    'Health,https://bilomax.com/health,API,bilomax-api'
  ].join('\n')
  const { rows, errors } = parseCsvUrls(csv)
  assert.deepEqual(errors, [])
  assert.equal(rows[0].group, 'bilomax-api')
})

test('parseCsvUrls rejects a row with no group', () => {
  const csv = [
    'name,url,group',
    'Health,https://bilomax.com/health,'
  ].join('\n')
  const { rows, errors } = parseCsvUrls(csv)
  assert.equal(rows.length, 0)
  assert.equal(errors[0], 'Row 2: Missing group')
})
