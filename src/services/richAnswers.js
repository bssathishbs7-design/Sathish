/** Stored response: legacy plain string, or {format:'html', html:string}.
 * Image data URLs are durable mock-upload results stored atomically with the answer.
 * Replace uploadAnswerImage with the authenticated upload API at backend integration.
 */
export const isRichAnswer = answer => answer?.format === 'html' && typeof answer.html === 'string'
export const escapeAnswerText = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
export const answerHtml = answer => isRichAnswer(answer) ? answer.html : escapeAnswerText(answer).replaceAll('\n', '<br>')
export function hasAnswerContent(answer) {
  if (!isRichAnswer(answer)) return Boolean(String(answer ?? '').trim())
  const html = answer.html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  return /<img\b[^>]*\bsrc=["'](?:data:image\/(?:png|jpeg|webp);base64,|https:\/\/)[^"']+["']/i.test(html)
    || Boolean(html.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;|&#xA0;|[\s\u200B-\u200D\uFEFF]/gi, ''))
}

/** @param {File} file @returns {Promise<{url:string,name:string}>} */
export async function uploadAnswerImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG or WebP image.')
  if (file.size > 512 * 1024) throw new Error('Choose an image smaller than 512 KB.')
  const url = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('The image could not be read. Please try again.'))
    reader.readAsDataURL(file)
  })
  await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('This image is damaged or unsupported. Choose another image.'))
    image.src = url
  })
  return { url, name: file.name }
}
