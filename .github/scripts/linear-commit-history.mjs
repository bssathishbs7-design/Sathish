import { readFileSync, appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const HISTORY_TITLE = 'Sathish — Commit history'
/** Convert the generated Markdown disclosure blocks into headings supported by Linear. */
export function linearHistoryContent(markdown) {
  if (!markdown.startsWith('# Commit history\n') || !markdown.includes('## Changes by commit')) throw new Error('A complete generated commit-history document is required.')
  return markdown.replaceAll('<details>\n<summary>Changed files</summary>', '**Changed files**').replaceAll('</details>', '')
}

/** Refresh one automation-owned team document; the fixed ID prevents duplicate creation on reruns. */
export async function publishHistory({ markdown, env, fetchImpl = fetch }) {
  for (const name of ['LINEAR_API_KEY', 'LINEAR_TEAM_ID', 'LINEAR_HISTORY_DOCUMENT_ID']) {
    if (!env[name]) throw new Error(`Missing ${name}. Configure the workflow before publishing.`)
  }
  const content = linearHistoryContent(markdown)
  const request = async (query, variables) => {
    const response = await fetchImpl('https://api.linear.app/graphql', {
      method: 'POST', signal: AbortSignal.timeout(60000),
      headers: { Authorization: env.LINEAR_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
    if (!response.ok) throw new Error(`Linear document request failed (HTTP ${response.status}).`)
    const result = await response.json()
    if (result.errors?.length || !result.data) throw new Error('Linear rejected the document request. Check document size, API access and team configuration.')
    return result.data
  }
  const id = env.LINEAR_HISTORY_DOCUMENT_ID
  const found = await request('query($id: ID!) { documents(filter: { id: { eq: $id } }, first: 1) { nodes { id title content url trashed team { id } } } }', { id })
  const existing = found.documents.nodes[0]
  if (existing && (existing.trashed || existing.team?.id !== env.LINEAR_TEAM_ID)) throw new Error('The configured document is trashed or belongs to another team. Refusing to overwrite it.')
  if (existing?.title === HISTORY_TITLE && existing.content === content) return { document: existing, unchanged: true }
  if (existing) {
    const data = await request('mutation($id: String!, $input: DocumentUpdateInput!) { documentUpdate(id: $id, input: $input) { success document { id url title } } }', { id, input: { title: HISTORY_TITLE, content } })
    if (!data.documentUpdate.success || !data.documentUpdate.document) throw new Error('Linear did not confirm the document update.')
    return { document: data.documentUpdate.document }
  }
  const data = await request('mutation($input: DocumentCreateInput!) { documentCreate(input: $input) { success document { id url title } } }', { input: { id, title: HISTORY_TITLE, teamId: env.LINEAR_TEAM_ID, content } })
  if (!data.documentCreate.success || !data.documentCreate.document) throw new Error('Linear did not confirm document creation. Rerun to check the same document ID before creating anything.')
  return { document: data.documentCreate.document }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await publishHistory({ markdown: readFileSync('COMMIT_HISTORY.md', 'utf8'), env: process.env })
    const summary = `${result.unchanged ? 'Already current' : 'Updated'}: [${HISTORY_TITLE}](${result.document.url})`
    console.log(summary)
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n')
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
