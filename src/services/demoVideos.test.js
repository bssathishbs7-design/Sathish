import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { applyDemoMedia } from './demoVideos.js'
import { DEMO_VIDEOS, demoPageLabel, demosAllowed } from '../config/demoVideos.js'
import { APP_PAGES } from '../config/appPages.js'
test('runtime catalogue contains all fourteen verified Medsy videos in workflow order', () => {
  const videos = applyDemoMedia(JSON.parse(fs.readFileSync(new URL('../../public/demo-videos.json', import.meta.url))))
  assert.equal(videos.length, 14)
  assert.equal(new Set(videos.map(video => video.videoId)).size, 14)
  assert.equal(videos.filter(video => video.series === 'skills').length, 9)
  assert.ok(videos.every(video => video.videoId && video.duration > 0))
  assert.equal(videos[0].videoId, 'O1MhhLe2MNc')
  assert.equal(videos[5].step, '05–06')
})
test('configuration rejects unsafe media and transcript values and unknown schema', () => {
  assert.throws(() => applyDemoMedia({ version: 2 }), /unavailable/)
  const video = applyDemoMedia({ version: 1, videos: { [DEMO_VIDEOS[0].id]: { videoId: '<script>', transcriptUrl: 'javascript:alert(1)', duration: -1 } } })[0]
  assert.equal(video.videoId, null); assert.equal(video.transcriptUrl, null); assert.equal(video.duration, null)
})
test('all exam routes and unsupported mobile screens exclude demos; sidebar names are reused', () => {
  for (const page of [APP_PAGES.STUDENT_EXAM, APP_PAGES.ONLINE_PRACTICE_EXAM, APP_PAGES.ONLINE_PROCTORED_EXAM, APP_PAGES.LOGIN]) assert.equal(demosAllowed(page, false), false)
  assert.equal(demosAllowed(APP_PAGES.CONFIGURATION, true), false)
  assert.equal(demosAllowed(APP_PAGES.REVIEW_APPROVE, false), true)
  assert.equal(demoPageLabel(APP_PAGES.QUESTION_BANK), 'My Questions')
  assert.equal(demoPageLabel(APP_PAGES.QUESTION_BANK_NON_CREATE), 'Question Bank')
})
