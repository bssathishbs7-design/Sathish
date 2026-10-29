import { DEMO_VIDEOS } from '../config/demoVideos.js'

const youtubeId = /^[A-Za-z0-9_-]{11}$/
/** Runtime JSON shape: {version:1,videos:{[catalogueId]:{videoId:string,duration?:number,transcriptUrl?:string}}}.
 * Publish /demo-videos.json separately from the JS bundle to replace media without a code release.
 * Transcript URLs must be same-origin paths or HTTPS URLs. No arbitrary iframe URLs are accepted.
 */
export function applyDemoMedia(payload) {
  if (payload?.version !== 1 || !payload.videos || typeof payload.videos !== 'object') throw new Error('The demo catalogue is unavailable.')
  return DEMO_VIDEOS.map(video => {
    const media = payload.videos[video.id] || {}
    const transcriptUrl = typeof media.transcriptUrl === 'string' && (/^https:\/\//.test(media.transcriptUrl) || /^\/(?!\/)/.test(media.transcriptUrl)) ? media.transcriptUrl : null
    return { ...video, videoId: youtubeId.test(media.videoId || '') ? media.videoId : null,
      duration: Number.isFinite(media.duration) && media.duration > 0 ? media.duration : null, transcriptUrl }
  })
}
/** Replace this asynchronous adapter with an authorised catalogue API when available. */
export async function fetchDemoVideos({ signal } = {}) {
  const response = await fetch('/demo-videos.json', { signal, cache: 'no-cache' })
  if (!response.ok) throw new Error('Unable to load demo videos. Try again.')
  return applyDemoMedia(await response.json())
}
