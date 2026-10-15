/** Fill missing first-year records with stable sample ratings; saved records always win.
 * Internal Non-Clinical is displayed as Para - Clinical by the rating UI.
 * @param {Array<{year:string,subject:string,topic:string,code:string,name:string}>} rows Curriculum rows.
 * @param {Object<string,{values:{type:string,rating:string,impact:string,frequency:string}}>} saved Existing saved ratings.
 * @returns {Object} A new ratings map using the existing persistence shape.
 */
export function withFirstYearCorrelationDefaults(rows, saved = {}) {
  const result = { ...saved }
  for (const row of rows) {
    if (row.year !== '1st Year') continue
    const key = [row.year, row.subject, row.topic, row.code, row.name].join('::')
    if (Object.hasOwn(result, key)) continue
    // A seeded hash distributes 1/2/3 without changing values on each reload.
    let hash = 2166136261
    for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
    result[key] = { values: { type: 'Non-Clinical', rating: String((hash >>> 0) % 3 + 1), impact: '', frequency: '' } }
  }
  return result
}
