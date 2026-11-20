import test from 'node:test'
import assert from 'node:assert/strict'
import { readUnreadBlueprintTemplates, updateUnreadBlueprintTemplates } from './blueprintTemplateNotifications.js'

test('unread counts persist, deduplicate saves and clear only viewed templates', () => {
  const values = new Map()
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  assert.deepEqual(readUnreadBlueprintTemplates(storage), [])
  updateUnreadBlueprintTemplates({ added: ['one', 'two', 'one'] }, storage)
  assert.deepEqual(readUnreadBlueprintTemplates(storage), ['one', 'two'])
  updateUnreadBlueprintTemplates({ seen: ['one'] }, storage)
  assert.deepEqual(readUnreadBlueprintTemplates(storage), ['two'])
  updateUnreadBlueprintTemplates({ seen: ['two'] }, storage)
  assert.deepEqual(readUnreadBlueprintTemplates(storage), [])
})

test('malformed or unavailable notification storage does not break the library', () => {
  assert.deepEqual(readUnreadBlueprintTemplates({ getItem: () => '{' }), [])
  assert.deepEqual(updateUnreadBlueprintTemplates({ added: ['one'] }, {
    getItem: () => null, setItem: () => { throw Error('quota') },
  }), ['one'])
})
