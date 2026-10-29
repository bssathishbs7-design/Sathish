let pending
/** Load the shared IFrame API once without taking ownership of another consumer's ready callback. */
export function loadYouTubePlayer() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (pending) return pending
  pending = new Promise((resolve, reject) => {
    let script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
    const owned = !script
    if (!script) { script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api'; script.async = true }
    const stop = () => { clearInterval(poll); clearTimeout(timeout); script.removeEventListener('error', fail) }
    const fail = () => { stop(); if (owned) script.remove(); pending = null; reject(new Error('Progress tracking is unavailable. You can still use the video controls.')) }
    const poll = setInterval(() => { if (window.YT?.Player) { stop(); resolve(window.YT) } }, 100)
    const timeout = setTimeout(fail, 8000)
    script.addEventListener('error', fail, { once: true })
    if (owned) document.head.appendChild(script)
  })
  return pending
}
