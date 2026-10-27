import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const HISTORY_MARKER = 'Medsy-Commit-History: generated'
const git = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '&#124;').replace(/`/g, '&#96;').replace(/[\r\n]+/g, ' ')

/** Git's NUL-delimited numstat format preserves spaces, tabs and newlines in filenames. */
export function parseFileChanges(output) {
  return output.split('\0').filter(Boolean).map(row => {
    const match = row.match(/^([^\t]+)\t([^\t]+)\t([\s\S]+)$/)
    if (!match) throw new Error('Unexpected Git file-change record.')
    return { added: match[1], removed: match[2], path: match[3] }
  })
}

/** Read committed history only. Merge file totals compare against the first parent. */
export function collectHistory(ref = 'HEAD') {
  const fields = git(['log', ref, '--date-order', '-z', '--format=%H%x00%h%x00%cI%x00%aI%x00%an%x00%s%x00%b%x00%P']).split('\0')
  if (fields.at(-1) === '') fields.pop()
  if (fields.length % 8) throw new Error('Unexpected Git commit metadata.')
  const commits = []
  for (let index = 0; index < fields.length; index += 8) {
    const [sha, short, committedAt, authoredAt, author, subject, body, parents] = fields.slice(index, index + 8)
    if (body.split(/\r?\n/).includes(HISTORY_MARKER)) continue
    const firstParent = parents.split(' ')[0]
    const changes = parseFileChanges(git(firstParent
      ? ['diff', '--numstat', '-z', '--no-renames', firstParent, sha, '--']
      : ['diff-tree', '--root', '--no-commit-id', '-r', '--numstat', '-z', '--no-renames', sha, '--']))
    commits.push({ sha, short, committedAt, authoredAt, author, subject, body, merge: parents.includes(' '), changes })
  }
  return commits
}

export function renderHistory(commits, repositoryUrl) {
  const formatTime = value => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(new Date(value)) + ' IST (UTC+05:30)'
  const lines = [
    '# Commit history', '',
    `Repository: [${repositoryUrl.split('/').slice(-2).join('/')}](${repositoryUrl})`, '',
    `Recorded commits: **${commits.length}**. Latest recorded commit: **${commits[0]?.short || 'None'}**.`, '',
    'Dates below are commit timestamps, displayed in India Standard Time. They are not push timestamps. Original ISO timestamps and author dates are retained in each entry.', '',
    'This document covers committed history reachable from the checked-out branch, newest first. Uncommitted changes and generated history-update commits are excluded. Descriptions come from the original commit messages; changed files and line counts come directly from Git. Binary changes have no line counts. Renames appear as deletion/addition pairs. Merge changes compare against the first parent.', '',
    'Update locally: `node "linear automation/generate-commit-history.mjs"`. Once enabled, the GitHub workflow refreshes the editable commit-history document in Linear Medsy_UI after pushes to main. This is automatically generated content; record review discussions in document comments.', '',
    '## Commit index', '',
    '| Date and time (IST) | Commit | Description | Files changed |',
    '| --- | --- | --- | ---: |',
    ...commits.map(commit => `| ${formatTime(commit.committedAt)} | [${commit.short}](${repositoryUrl}/commit/${commit.sha}) | ${escape(commit.subject)} | ${commit.changes.length} |`),
    '', '## Changes by commit', '',
  ]
  for (const commit of commits) {
    const added = commit.changes.reduce((total, file) => total + (Number(file.added) || 0), 0)
    const removed = commit.changes.reduce((total, file) => total + (Number(file.removed) || 0), 0)
    lines.push(`### ${commit.short} — ${escape(commit.subject)}`, '',
      `- **Committed:** ${formatTime(commit.committedAt)} (${commit.committedAt})`,
      `- **Author:** ${escape(commit.author)}`,
      `- **Authored:** ${commit.authoredAt}`,
      `- **Changes:** ${commit.changes.length} files; ${added} lines added; ${removed} lines removed${commit.merge ? '; merge compared with first parent' : ''}.`,
      `- **Review:** [Open commit](${repositoryUrl}/commit/${commit.sha})`, '')
    if (commit.body.trim()) lines.push('Commit notes:', '', ...commit.body.trim().split(/\r?\n/).map(line => `> ${escape(line)}`), '')
    if (!commit.changes.length) lines.push('No file changes (empty commit or identical tree).', '')
    else lines.push('<details>', '<summary>Changed files</summary>', '', '| File | Lines added | Lines removed |', '| --- | ---: | ---: |',
      ...commit.changes.map(file => `| ${escape(file.path)} | ${file.added === '-' ? 'Binary' : file.added} | ${file.removed === '-' ? 'Binary' : file.removed} |`), '', '</details>', '')
  }
  return lines.join('\n')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.chdir(git(['rev-parse', '--show-toplevel']).trim())
  if (git(['rev-parse', '--is-shallow-repository']).trim() === 'true') throw new Error('Full Git history is required. Fetch with depth 0 before generating this document.')
  const remote = git(['remote', 'get-url', 'origin']).trim()
  const match = remote.match(/^(?:https:\/\/github\.com\/|git@github\.com:)([\w.-]+\/[\w.-]+?)(?:\.git)?$/)
  if (!match) throw new Error('Expected a GitHub origin URL without embedded credentials.')
  const commits = collectHistory()
  writeFileSync('linear automation/COMMIT_HISTORY.md', renderHistory(commits, `https://github.com/${match[1]}`))
  console.log(`linear automation/COMMIT_HISTORY.md updated: ${commits.length} commits, latest ${commits[0]?.short || 'none'}.`)
}
