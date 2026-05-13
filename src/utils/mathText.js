export const MATH_PATTERN = /(\\frac|\\sqrt|\\sum|\\int|\\lim|\\pm|\\mp|\\times|\\div|\\cdot|\\le|\\ge|\\neq|\\approx|\\alpha|\\beta|\\gamma|\\delta|\\Delta|\\theta|\\lambda|\\mu|\\pi|\\rho|\\sigma|\\Omega|[\^_{}]|[\u00b0-\u00b3\u00b5\u00b9\u00bc-\u00be\u2070-\u209c\u2113\u2126\u2190-\u21ff\u2200-\u22ff\u03b1-\u03c9\u0391-\u03a9])/

const COMMAND_SYMBOLS = {
  '\\pm': '\u00b1',
  '\\mp': '\u2213',
  '\\times': '\u00d7',
  '\\div': '\u00f7',
  '\\cdot': '\u00b7',
  '\\cdots': '\u22ef',
  '\\ldots': '\u2026',
  '\\le': '\u2264',
  '\\leq': '\u2264',
  '\\ge': '\u2265',
  '\\geq': '\u2265',
  '\\neq': '\u2260',
  '\\ne': '\u2260',
  '\\equiv': '\u2261',
  '\\approx': '\u2248',
  '\\propto': '\u221d',
  '\\infty': '\u221e',
  '\\partial': '\u2202',
  '\\nabla': '\u2207',
  '\\sum': '\u2211',
  '\\int': '\u222b',
  '\\lim': 'lim',
  '\\sin': 'sin',
  '\\cos': 'cos',
  '\\tan': 'tan',
  '\\log': 'log',
  '\\ln': 'ln',
  '\\alpha': '\u03b1',
  '\\beta': '\u03b2',
  '\\gamma': '\u03b3',
  '\\delta': '\u03b4',
  '\\Delta': '\u0394',
  '\\epsilon': '\u03b5',
  '\\eta': '\u03b7',
  '\\theta': '\u03b8',
  '\\lambda': '\u03bb',
  '\\mu': '\u03bc',
  '\\nu': '\u03bd',
  '\\rho': '\u03c1',
  '\\sigma': '\u03c3',
  '\\pi': '\u03c0',
  '\\phi': '\u03c6',
  '\\omega': '\u03c9',
  '\\Omega': '\u03a9',
  '\\rightarrow': '\u2192',
  '\\to': '\u2192',
  '\\leftarrow': '\u2190',
  '\\Rightarrow': '\u21d2',
  '\\Leftarrow': '\u21d0',
  '\\leftrightarrow': '\u2194',
  '\\left': '',
  '\\right': '',
}

const UNICODE_SUPERSCRIPTS = {
  '\u2070': '0',
  '\u00b9': '1',
  '\u00b2': '2',
  '\u00b3': '3',
  '\u2074': '4',
  '\u2075': '5',
  '\u2076': '6',
  '\u2077': '7',
  '\u2078': '8',
  '\u2079': '9',
  '\u207a': '+',
  '\u207b': '-',
  '\u207d': '(',
  '\u207e': ')',
  '\u2071': 'i',
  '\u207f': 'n',
}

const UNICODE_SUBSCRIPTS = {
  '\u2080': '0',
  '\u2081': '1',
  '\u2082': '2',
  '\u2083': '3',
  '\u2084': '4',
  '\u2085': '5',
  '\u2086': '6',
  '\u2087': '7',
  '\u2088': '8',
  '\u2089': '9',
  '\u208a': '+',
  '\u208b': '-',
  '\u208d': '(',
  '\u208e': ')',
  '\u2090': 'a',
  '\u2091': 'e',
  '\u2092': 'o',
  '\u2093': 'x',
  '\u2095': 'h',
  '\u1d62': 'i',
  '\u2c7c': 'j',
  '\u2096': 'k',
  '\u2097': 'l',
  '\u2098': 'm',
  '\u2099': 'n',
  '\u209a': 'p',
  '\u1d63': 'r',
  '\u209b': 's',
  '\u209c': 't',
  '\u1d64': 'u',
  '\u1d65': 'v',
}

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const readGroup = (value, startIndex) => {
  if (value[startIndex] !== '{') return { content: '', endIndex: startIndex }

  let depth = 0
  for (let index = startIndex; index < value.length; index += 1) {
    if (value[index] === '{') depth += 1
    if (value[index] === '}') depth -= 1
    if (depth === 0) {
      return {
        content: value.slice(startIndex + 1, index),
        endIndex: index + 1,
      }
    }
  }

  return { content: value.slice(startIndex + 1), endIndex: value.length }
}

const readScript = (value, startIndex) => {
  if (value[startIndex] === '{') return readGroup(value, startIndex)
  return { content: value[startIndex] ?? '', endIndex: Math.min(startIndex + 1, value.length) }
}

export const hasMathText = (value) => MATH_PATTERN.test(String(value ?? ''))

const normalizeUnicodeScripts = (value) => {
  let output = ''
  let index = 0

  while (index < value.length) {
    const superscript = UNICODE_SUPERSCRIPTS[value[index]]
    const subscript = UNICODE_SUBSCRIPTS[value[index]]

    if (superscript || subscript) {
      const map = superscript ? UNICODE_SUPERSCRIPTS : UNICODE_SUBSCRIPTS
      const prefix = superscript ? '^' : '_'
      let content = ''

      while (index < value.length && map[value[index]]) {
        content += map[value[index]]
        index += 1
      }

      output += `${prefix}{${content}}`
      continue
    }

    output += value[index]
    index += 1
  }

  return output
}

export const normalizeFormulaText = (value) => normalizeUnicodeScripts(String(value ?? ''))
  .replaceAll('½', '\\frac{1}{2}')
  .replaceAll('¼', '\\frac{1}{4}')
  .replaceAll('¾', '\\frac{3}{4}')
  .replaceAll('×', '\\times')
  .replaceAll('÷', '\\div')
  .replaceAll('±', '\\pm')
  .replaceAll('≤', '\\le')
  .replaceAll('≥', '\\ge')
  .replaceAll('≠', '\\neq')
  .replaceAll('≈', '\\approx')

export const stripHtml = (value) => String(value ?? '')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim()

export const renderMathTextToHtml = (value) => {
  const source = normalizeFormulaText(value)
  const parts = []
  let buffer = ''
  let index = 0

  const flushBuffer = () => {
    if (!buffer) return
    parts.push(escapeHtml(buffer))
    buffer = ''
  }

  while (index < source.length) {
    if (source.startsWith('\\frac', index)) {
      const numerator = readGroup(source, index + 5)
      const denominator = readGroup(source, numerator.endIndex)

      if (numerator.content && denominator.content) {
        flushBuffer()
        parts.push(
          `<span class="math-text-fraction"><span class="math-text-numerator">${renderMathTextToHtml(numerator.content)}</span><span class="math-text-denominator">${renderMathTextToHtml(denominator.content)}</span></span>`,
        )
        index = denominator.endIndex
        continue
      }
    }

    if (source.startsWith('\\sqrt', index)) {
      const radicand = readGroup(source, index + 5)

      if (radicand.content) {
        flushBuffer()
        parts.push(
          `<span class="math-text-root"><span class="math-text-root-symbol">\u221a</span><span class="math-text-radicand">${renderMathTextToHtml(radicand.content)}</span></span>`,
        )
        index = radicand.endIndex
        continue
      }
    }

    const command = Object.keys(COMMAND_SYMBOLS).find((item) => source.startsWith(item, index))
    if (command) {
      buffer += COMMAND_SYMBOLS[command]
      index += command.length
      continue
    }

    if (source[index] === '^' || source[index] === '_') {
      const isSuperscript = source[index] === '^'
      const script = readScript(source, index + 1)

      if (script.content) {
        flushBuffer()
        const tag = isSuperscript ? 'sup' : 'sub'
        parts.push(`<${tag}>${renderMathTextToHtml(script.content)}</${tag}>`)
        index = script.endIndex
        continue
      }
    }

    buffer += source[index]
    index += 1
  }

  flushBuffer()
  return parts.join('')
}
