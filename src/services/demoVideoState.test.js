import test from 'node:test'
import assert from 'node:assert/strict'
import { readDemoProgress, saveDemoProgress, setDemoVideosEnabled, markDemoPrompted } from './demoVideoState.js'

test('preferences, prompts and progress are isolated by viewer and video revision', () => {
  const previous = globalThis.localStorage
  const data = new Map()
  globalThis.localStorage = { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) }
  try {
    setDemoVideosEnabled('viewer-test-a', false)
    markDemoPrompted('viewer-test-a', 'intro:old')
    saveDemoProgress('viewer-test-a', 'intro:old', { position: 95, duration: 100, ranges: [[0, 95]], started: true, watched: true })
    assert.equal(readDemoProgress('viewer-test-a', 'intro:old').watched, true)
    assert.equal(readDemoProgress('viewer-test-b', 'intro:old').watched, false)
    assert.equal(readDemoProgress('viewer-test-a', 'intro:new').watched, false)
    assert.equal(JSON.parse(data.get('medsy-demo-videos-v1:viewer-test-a')).enabled, false)
    saveDemoProgress('viewer-test-a', 'intro:old', { position: 2, duration: 100, ranges: [[0, 2]], started: true, watched: false })
    assert.equal(readDemoProgress('viewer-test-a', 'intro:old').watched, true)
    assert.deepEqual(readDemoProgress('viewer-test-a', 'intro:old').ranges, [[0, 95]])
  } finally { globalThis.localStorage = previous }
})
test('blocked storage retains useful progress in memory without crashing playback', () => {
  const previous = globalThis.localStorage
  globalThis.localStorage = { getItem: () => { throw Error('blocked') }, setItem: () => { throw Error('blocked') } }
  try {
    saveDemoProgress('blocked-viewer', 'intro', { position: 10, duration: 100, ranges: [[0, 10]], started: true, watched: false })
    assert.equal(readDemoProgress('blocked-viewer', 'intro').position, 10)
  } finally { globalThis.localStorage = previous }
})
