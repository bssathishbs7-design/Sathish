/** Optimise embedded raster images; keep external URLs, SVGs and failed conversions intact. */
export async function optimiseAssessmentImage(source) {
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(source) || source.length < 100000) return source
  return new Promise(resolve => {
    const image = new Image()
    const timeout = setTimeout(() => resolve(source), 10000)
    image.onload = () => {
      clearTimeout(timeout)
      try {
        const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
        const context = canvas.getContext('2d')
        if (!context) return resolve(source)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const compressed = canvas.toDataURL('image/webp', .9)
        resolve(compressed.length < source.length ? compressed : source)
      } catch { resolve(source) }
    }
    image.onerror = () => { clearTimeout(timeout); resolve(source) }
    image.src = source
  })
}

/** Keep all published content, excluding the private editor workspace. Repeated images share work.
 * @param {Object[]} rows Published assessment records.
 * @param {(source:string)=>Promise<string>} optimise Image optimiser.
 * @returns {Promise<Object[]>} Complete, compact published snapshots.
 */
export async function compactPublishedAssessments(rows, optimise = optimiseAssessmentImage) {
  const images = new Map()
  const visit = async value => {
    if (typeof value === 'string' && value.startsWith('data:image/')) {
      if (!images.has(value)) images.set(value, Promise.resolve(optimise(value)))
      return images.get(value)
    }
    if (Array.isArray(value)) return Promise.all(value.map(visit))
    if (!value || typeof value !== 'object') return value
    return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await visit(item)])))
  }
  return Promise.all(rows.map(row => {
    const setup = { ...row.setup }
    delete setup.draftWorkspace
    return visit({ ...row, setup })
  }))
}

/** Atomic single-key save: a quota failure leaves all existing published records intact. */
export async function savePublishedAssessments(rows, storage = localStorage, optimise) {
  const compact = await compactPublishedAssessments(rows, optimise)
  storage.setItem('vx-assessment-published', JSON.stringify(compact))
  return compact
}
