import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyDemoProgress, mergePlayedRanges, playedSeconds, resumePosition, sampleDemoProgress } from './demoVideoProgress.js'

const sample = (position, wallTime, playing = true, rate = 1) => ({ position, wallTime, playing, rate, duration: 100 })
test('recency changes only during playback and survives paused saves', () => {
  const playing = sampleDemoProgress(emptyDemoProgress(), { ...sample(10, 1000), recordedAt: 10000 }, null)
  assert.equal(playing.lastPlayedAt, 10000)
  const paused = sampleDemoProgress(playing, { ...sample(10, 1500, false), recordedAt: 20000 }, null)
  assert.equal(paused.lastPlayedAt, 10000)
  assert.equal(sampleDemoProgress(emptyDemoProgress(), { ...sample(0, 0, false), recordedAt: 20000 }, null).lastPlayedAt, undefined)
})
test('coverage is the union of actual played ranges, not number of replays', () => {
  assert.deepEqual(mergePlayedRanges([[10, 20], [0, 12], [18, 30], [50, 60], [NaN, 80], [-2, 1], [90, 110]], 100), [[0, 30], [50, 60], [90, 100]])
  assert.equal(playedSeconds({ ranges: mergePlayedRanges([[0, 10], [0, 10]], 100) }), 10)
})
test('seeking to the end or rewinding earns no credit and does not mark watched', () => {
  const skipped = sampleDemoProgress(emptyDemoProgress(), sample(99, 500), sample(0, 0))
  assert.equal(playedSeconds(skipped), 0)
  assert.equal(skipped.watched, false)
  assert.equal(skipped.position, 99)
  assert.equal(playedSeconds(sampleDemoProgress(skipped, sample(0, 1000), sample(99, 500))), 0)
})
test('playing 90 percent marks watched permanently; replay never clears completion', () => {
  let progress = emptyDemoProgress()
  for (let i = 1; i <= 180; i++) progress = sampleDemoProgress(progress, sample(i / 2, i * 500), sample((i - 1) / 2, (i - 1) * 500))
  assert.equal(progress.watched, true)
  assert.equal(playedSeconds(progress), 90)
  assert.equal(sampleDemoProgress(progress, sample(0, 100000, false), null).watched, true)
})
test('paused, hidden/throttled intervals and playback rate changes receive no credit', () => {
  assert.equal(playedSeconds(sampleDemoProgress(emptyDemoProgress(), sample(1, 1000, false), sample(0, 0))), 0)
  assert.equal(playedSeconds(sampleDemoProgress(emptyDemoProgress(), sample(10, 10000), sample(0, 0))), 0)
  assert.equal(playedSeconds(sampleDemoProgress(emptyDemoProgress(), sample(1, 500, true, 2), sample(0, 0))), 0)
  assert.equal(playedSeconds(sampleDemoProgress(emptyDemoProgress(), sample(1, 500, true, 2), sample(0, 0, true, 2))), 1)
})
test('resume excludes the first and final five seconds', () => {
  for (const position of [0, 5, 95, 100]) assert.equal(resumePosition({ position, duration: 100 }), 0)
  assert.equal(resumePosition({ position: 40, duration: 100 }), 40)
})
