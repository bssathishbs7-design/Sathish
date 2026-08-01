import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeRichHtml } from './sanitizeHtml.js'

test('uses an escaped safe fallback when a browser DOM is unavailable', () => {
  assert.equal(
    sanitizeRichHtml('<img src=x onerror=alert(1)><script>alert(2)</script>'),
    '&lt;img src=x onerror=alert(1)&gt;&lt;script&gt;alert(2)&lt;/script&gt;',
  )
})
