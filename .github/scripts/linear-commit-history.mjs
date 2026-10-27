import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { collectHistory } from '../../scripts/generate-commit-history.mjs'

export const DOCUMENT_LIMIT = 240000
const escape = value => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '&#124;').replace(/`/g, '&#96;').replace(/[\r\n]+/g, ' ')
const time = value => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(new Date(value)) + ' IST'

/** One reference-style table. Long file lists link to the full diff; each row has exact total line counts. */
export function renderLinearHistory(commits, repository = 'bssathishbs7-design/Sathish') {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Invalid GitHub repository.')
  const base = `https://github.com/${repository}`
  const header = '## Commit history\n\n| S. no. | Description and author | Date and time in IST | Changed files and line counts | GitHub commit links |\n| ---: | --- | --- | --- | --- |\n'
  const row = (commit, fileLimit, index) => {
    const added = commit.changes.reduce((sum, file) => sum + (Number(file.added) || 0), 0)
    const removed = commit.changes.reduce((sum, file) => sum + (Number(file.removed) || 0), 0)
    const binary = commit.changes.filter(file => file.added === '-' || file.removed === '-').length
    const files = commit.changes.slice(0, fileLimit).map(file => `${escape(file.path)} (+${file.added}/-${file.removed})`).join('; ')
    const remainder = commit.changes.length > fileLimit ? `; ${commit.changes.length - fileLimit} more files in commit link` : ''
    const changes = `${commit.changes.length} files (+${added} / -${removed})${binary ? `; ${binary} binary files (no line counts)` : ''}${commit.merge ? '; merge vs first parent' : ''}${files ? ': ' + files : ''}${remainder}`
    return `| ${index + 1} | ${escape(commit.subject).slice(0, 500)} — ${escape(commit.author).slice(0, 100)} | ${time(commit.committedAt)} | ${changes} | [${commit.short}](${base}/commit/${commit.sha}) |\n`
  }
  for (const fileLimit of [3, 1, 0]) {
    const rendered = commits.map((commit, index) => row(commit, fileLimit, index))
    if ((header + rendered.join('')).length <= DOCUMENT_LIMIT) return header + rendered.join('')
    if (fileLimit === 0) {
      let content = header, count = 0
      for (const line of rendered) { if (content.length + line.length > DOCUMENT_LIMIT - 500) break; content += line; count++ }
      return content + `\nShowing the newest ${count} of ${commits.length} commits to stay within Linear's document limit. [Complete GitHub history](${base}/commits/main/).\n`
    }
  }
}

/** Update only the user-selected document. Never creates or renames documents. */
export async function publishHistory({ content, env, fetchImpl = fetch }) {
  for (const name of ['LINEAR_API_KEY', 'LINEAR_TEAM_ID', 'LINEAR_HISTORY_DOCUMENT_ID']) if (!env[name]) throw new Error(`Missing ${name}.`)
  if (!content?.startsWith('## Commit history\n') || content.length > DOCUMENT_LIMIT) throw new Error('A valid, size-bounded commit-history table is required.')
  const request = async (query, variables) => {
    const response = await fetchImpl('https://api.linear.app/graphql', { method: 'POST', signal: AbortSignal.timeout(60000),
      headers: { Authorization: env.LINEAR_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) })
    if (!response.ok) throw new Error(`Linear document request failed (HTTP ${response.status}).`)
    const result = await response.json()
    if (result.errors?.length || !result.data) {
      const details = (result.errors || []).map(error => [error.extensions?.code, error.extensions?.userPresentableMessage || error.message].filter(Boolean).join(': ')).join('; ')
      throw new Error('Linear rejected the document request: ' + details.replaceAll(env.LINEAR_API_KEY, '[redacted]').replace(/[\r\n]/g, ' ').slice(0, 600))
    }
    return result.data
  }
  const id = env.LINEAR_HISTORY_DOCUMENT_ID
  const found = await request('query($id: ID!) { documents(filter: { id: { eq: $id } }, first: 1) { nodes { id title content url trashed team { id } } } }', { id })
  const existing = found.documents.nodes[0]
  if (!existing) throw new Error('The selected Commit Document was not found. No new document will be created.')
  if (existing.trashed || existing.team?.id !== env.LINEAR_TEAM_ID) throw new Error('The selected document is trashed or belongs to another team. Refusing to overwrite it.')
  if (existing.content === content) return { document: existing, unchanged: true }
  const data = await request('mutation($id: String!, $input: DocumentUpdateInput!) { documentUpdate(id: $id, input: $input) { success document { id url title } } }', { id, input: { content } })
  if (!data.documentUpdate.success || !data.documentUpdate.document) throw new Error('Linear did not confirm the document update.')
  return { document: data.documentUpdate.document }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const content = renderLinearHistory(collectHistory(), process.env.GITHUB_REPOSITORY)
    const result = await publishHistory({ content, env: process.env })
    const summary = `${result.unchanged ? 'Already current' : 'Updated'}: [${result.document.title}](${result.document.url})`
    console.log(summary)
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n')
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
