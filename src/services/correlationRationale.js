/** Default explanatory copy; saved faculty rationale always takes precedence. */
const competencyRationales = {
  'AN1.1': 'Anatomical position, planes and movement terms provide a consistent language for describing the location and relationships of body structures.',
  'AN1.2': 'Understanding bone and bone marrow composition establishes the structural basis for studying skeletal support and blood cell formation.',
}

/** @param {{code: string, name: string, topic: string, subject: string, rationale?: string}} row */
export function getDefaultCorrelationRationale(row) {
  if (row.rationale?.trim()) return row.rationale
  if (competencyRationales[row.code]) return competencyRationales[row.code]
  return `This competency connects ${row.topic} with the learning objective: ${row.name}. Consider its relevance within ${row.subject} when assigning the correlation rating.`
}
