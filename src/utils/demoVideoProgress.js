/** @typedef {{position:number,duration:number,ranges:number[][],watched:boolean,started:boolean,lastPlayedAt?:number}} DemoProgress */
export const emptyDemoProgress = () => ({ position: 0, duration: 0, ranges: [], watched: false, started: false })
/** Union played intervals so rewatches never inflate coverage. Invalid/out-of-bounds ranges are discarded/clamped. */
export function mergePlayedRanges(ranges, duration) {
  const sorted = ranges.filter(range => Array.isArray(range) && range.length === 2 && range.every(Number.isFinite))
    .map(([start, end]) => [Math.max(0, start), Math.min(duration, end)]).filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0])
  return sorted.reduce((merged, range) => {
    const last = merged.at(-1)
    if (last && range[0] <= last[1] + .05) last[1] = Math.max(last[1], range[1])
    else merged.push([...range])
    return merged
  }, [])
}
export const playedSeconds = progress => (progress?.ranges || []).reduce((total, [start, end]) => total + end - start, 0)
export const resumePosition = progress => progress?.position > 5 && progress.duration - progress.position > 5 ? progress.position : 0
export const demoStatus = progress => progress?.watched ? 'Watched' : progress?.started ? 'In progress' : 'Not started'
/** A sample earns credit only while playing continuously. Seek jumps and delayed/hidden timers earn none.
 * @param {DemoProgress} progress
 * @param {{position:number,wallTime:number,playing:boolean,rate:number,duration:number,recordedAt?:number}} sample
 * @param {object|null} previous
 */
export function sampleDemoProgress(progress, sample, previous) {
  const duration = Number.isFinite(sample.duration) && sample.duration > 0 ? sample.duration : progress.duration
  if (!duration || !Number.isFinite(sample.position)) return progress
  const position = Math.max(0, Math.min(duration, sample.position))
  const elapsed = previous ? (sample.wallTime - previous.wallTime) / 1000 : 0
  const delta = previous ? position - previous.position : 0
  const continuous = previous?.playing && sample.playing && elapsed > 0 && elapsed <= 2
    && sample.rate === previous.rate && delta > 0 && delta <= elapsed * sample.rate + .25
  const ranges = mergePlayedRanges([...progress.ranges, ...(continuous ? [[previous.position, position]] : [])], duration)
  return { ...progress, position, duration, ranges, started: progress.started || sample.playing,
    lastPlayedAt: sample.playing && Number.isFinite(sample.recordedAt) ? sample.recordedAt : progress.lastPlayedAt,
    watched: progress.watched || playedSeconds({ ranges }) / duration >= .9 }
}
