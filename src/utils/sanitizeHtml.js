import DOMPurify from 'dompurify'

const RICH_TEXT_CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['audio', 'embed', 'form', 'iframe', 'input', 'link', 'meta', 'object', 'script', 'style', 'svg', 'video'],
  FORBID_ATTR: ['style'],
  ALLOW_DATA_ATTR: true,
}

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

export const sanitizeRichHtml = (value) => {
  const source = String(value ?? '')
  return typeof DOMPurify.sanitize === 'function'
    ? DOMPurify.sanitize(source, RICH_TEXT_CONFIG)
    : escapeHtml(source)
}
