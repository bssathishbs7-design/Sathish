import { STUDENT_COLUMNS } from './studentImport.js'
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate'

const sheetNs = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const relNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const escapeXml = value => String(value ?? '').replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char]))
const nodes = (doc, name) => [...doc.getElementsByTagNameNS('*', name)]

/** Partition validated student values between the first student sheet and Errors; retain unrelated worksheets. */
export async function createStudentErrorWorkbook(file, preview) {
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()))
  const parse = path => {
    if (!files[path]) throw new Error('The uploaded workbook is missing required Excel metadata.')
    const doc = new DOMParser().parseFromString(strFromU8(files[path]), 'application/xml')
    if (nodes(doc, 'parsererror').length) throw new Error('The uploaded workbook contains invalid Excel metadata.')
    return doc
  }
  const workbook = parse('xl/workbook.xml'), relationships = parse('xl/_rels/workbook.xml.rels'), types = parse('[Content_Types].xml')
  const sheets = nodes(workbook, 'sheets')[0]
  if (!sheets) throw new Error('The uploaded workbook has no worksheets.')
  const old = nodes(workbook, 'sheet').find(sheet => sheet.getAttribute('name')?.toLowerCase() === 'errors')
  if (old) {
    const id = old.getAttributeNS(relNs, 'id')
    const relationship = nodes(relationships, 'Relationship').find(item => item.getAttribute('Id') === id)
    const target = relationship?.getAttribute('Target')
    if (target) {
      const path = new URL(target, 'https://workbook.invalid/xl/workbook.xml').pathname.slice(1)
      delete files[path]
      nodes(types, 'Override').find(item => item.getAttribute('PartName') === '/' + path)?.remove()
    }
    relationship?.remove(); old.remove()
  }
  let index = 1
  while (files['xl/worksheets/studentErrors' + index + '.xml']) index++
  const path = 'xl/worksheets/studentErrors' + index + '.xml'
  const usedIds = new Set(nodes(relationships, 'Relationship').map(item => item.getAttribute('Id')))
  let id = 'rIdStudentErrors'
  while (usedIds.has(id)) id += '_'
  const sheetId = Math.max(0, ...nodes(workbook, 'sheet').map(sheet => Number(sheet.getAttribute('sheetId')))) + 1
  const sheet = workbook.createElementNS(sheets.namespaceURI, 'sheet')
  sheet.setAttribute('name', 'Errors'); sheet.setAttribute('sheetId', String(sheetId)); sheet.setAttributeNS(relNs, 'r:id', id); sheets.insertBefore(sheet, sheets.children[1] || null)
  const rel = relationships.createElementNS(relationships.documentElement.namespaceURI, 'Relationship')
  rel.setAttribute('Id', id); rel.setAttribute('Type', relNs + '/worksheet'); rel.setAttribute('Target', path.slice(3)); relationships.documentElement.appendChild(rel)
  const type = types.createElementNS(types.documentElement.namespaceURI, 'Override')
  type.setAttribute('PartName', '/' + path); type.setAttribute('ContentType', 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml'); types.documentElement.appendChild(type)
  const values = row => row.values || [row.draft.registrationId, row.draft.name, row.draft.email, row.draft.code, row.draft.phone, row.draft.section]
  const rows = [['Original row', ...STUDENT_COLUMNS, 'Errors'], ...preview.filter(row => row.errors.length).map(row => [row.row, ...values(row), (row.issues || row.errors.map(message => ({ field: 'Row', message }))).map(issue => issue.field + ': ' + issue.message).join('; ')])]
  const worksheet = rows => {
    const cells = rows.map((row, i) => '<row r="' + (i + 1) + '">' + row.map((value, j) => '<c r="' + String.fromCharCode(65 + j) + (i + 1) + '" t="inlineStr"><is><t xml:space="preserve">' + escapeXml(value) + '</t></is></c>').join('') + '</row>').join('')
    return strToU8('<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="' + sheetNs + '"><sheetData>' + cells + '</sheetData></worksheet>')
  }
  files[path] = worksheet(rows)
  const source = nodes(workbook, 'sheet').find(item => item.getAttribute('name')?.toLowerCase() !== 'errors')
  const sourceRel = nodes(relationships, 'Relationship').find(item => item.getAttribute('Id') === source?.getAttributeNS(relNs, 'id'))
  if (!sourceRel) throw new Error('The student worksheet could not be found.')
  const sourcePath = new URL(sourceRel.getAttribute('Target'), 'https://workbook.invalid/xl/workbook.xml').pathname.slice(1)
  files[sourcePath] = worksheet([STUDENT_COLUMNS, ...preview.filter(row => !row.errors.length).map(values)])
  const serialise = (path, doc) => { files[path] = strToU8(new XMLSerializer().serializeToString(doc)) }
  serialise('xl/workbook.xml', workbook); serialise('xl/_rels/workbook.xml.rels', relationships); serialise('[Content_Types].xml', types)
  return new Blob([zipSync(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
