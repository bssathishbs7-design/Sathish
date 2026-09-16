import { getPracticeTagSnapshot, buildPracticeTagAnalytics, enrichPracticeTagSession, resolvePracticeTagSnapshot } from './practiceTagAnalytics.js'
import { getPracticeQuestionBreakdown } from './practiceQuestionMetadata.js'

/** @typedef {{id: string, practice: string, attemptedAt: string, obtained: number, total: number, mcq: number, saqs: number, laqs: number, questionBreakdown: Object<string, {count: number, total: number}>}} AnalyticsAttempt */

/** Migrate legacy completed sessions using the same scoring functions as practice review. */
export function restoreCompletedPracticeHistory(card, sessions, scoreSession, totalMarks) {
  return {
    ...card,
    practiceSessions: sessions.map((session) => {
      const original = card.practiceSessions?.find((item) => String(item.id) === String(session.id)) ?? {}
      session = { ...original, ...session }
      const history = session.practiceAttemptHistory ?? []
      const completed = session.practiceSubmitted || ['completed', 'expired'].includes(String(session.status).trim().toLowerCase())
      if (history.length || !completed) return session
      const score = scoreSession(session)
      return {
        ...session,
        practiceAttemptHistory: [{
          ...score,
          tagSnapshot: getPracticeTagSnapshot(session),
          questionBreakdown: getPracticeQuestionBreakdown(session),
          id: `${session.id}-legacy-completed`,
          status: session.status === 'Expired' ? 'Expired' : 'Completed',
          attemptedAt: session.attemptedAt || session.completedAt || '',
          total: totalMarks(session, score.total),
          answers: session.practiceAnswers ?? {},
          tryLaterKeys: session.practiceTryLaterKeys ?? [],
        }],
      }
    }),
  }
}

/** Normalise saved completed attempts without including the current retake draft. */
export function buildCompetencyAnalytics(card = {}, questionSources = []) {
  const sessions = (Array.isArray(card.practiceSessions) ? card.practiceSessions : []).map(session => enrichPracticeTagSession(session, questionSources))
  const attempts = sessions.flatMap((session, index) => (
    (Array.isArray(session.practiceAttemptHistory) ? session.practiceAttemptHistory : []).filter((record) => record && (!record.status || ['completed', 'expired'].includes(String(record.status).toLowerCase()))).map((record, recordIndex) => ({
      id: String(record.id ?? `${session.id}-${recordIndex}`),
      practice: `Practice ${session.practiceNo || index + 1}`,
      attemptedAt: record.attemptedAt || '',
      obtained: Math.max(0, Number(record.obtained) || 0),
      total: Math.max(0, Number(record.total) || 0),
      mcq: Math.max(0, Number(record.mcq) || 0),
      saqs: Math.max(0, Number(record.saqs) || 0),
      laqs: Math.max(0, Number(record.laqs) || 0),
      tagSnapshot: resolvePracticeTagSnapshot(record.tagSnapshot, session),
      questionBreakdown: record.questionBreakdown ?? getPracticeQuestionBreakdown(session),
      types: ['MCQ', 'SAQ', 'LAQ'].filter((_, typeIndex) => Number(session[['mcq', 'saqs', 'laqs'][typeIndex]]) > 0).join(', '),
    }))
  )).sort((a, b) => (Date.parse(a.attemptedAt) || 0) - (Date.parse(b.attemptedAt) || 0))
  const breakdown = ['mcq', 'saqs', 'laqs'].map((key, index) => ({
    label: ['MCQ', 'SAQ', 'LAQ'][index],
    ...attempts.reduce((sum, attempt) => ({
      obtained: sum.obtained + attempt[key],
      total: sum.total + (attempt.questionBreakdown[key]?.total || 0),
      count: sum.count + (attempt.questionBreakdown[key]?.count || 0),
    }), { obtained: 0, total: 0, count: 0 }),
  }))
  return { code: card.competencyCode || '', name: card.competencyName || '', practiceCount: sessions.length, attempts, breakdown, tagAnalytics: buildPracticeTagAnalytics(attempts.map(attempt => attempt.tagSnapshot)) }
}

/** Static preview data for isolated UI development; never mixed with learner records. */
export const competencyAnalyticsSample = {
  competencyCode: 'RD7.5', competencyName: 'Role of imaging in clinical decision making',
  practiceSessions: [{ id: 'sample', practiceNo: 1, mcq: 1, saqs: 1, laqs: 0, questions: [{ type: 'MCQ', marks: 1, cognitiveLevel: 'Remember', thinkingLevel: 'LoT', cognitiveFunction: 'Pattern Recognition', skillFocus: 'Diagnosis' }, { type: 'SAQ', marks: 5, cognitiveLevel: 'Apply', thinkingLevel: 'HoT', cognitiveFunction: 'Judgement & Decision Making', skillFocus: 'Management' }], practiceAttemptHistory: [
    { id: 'sample-1', attemptedAt: '2026-09-08T10:00:00Z', obtained: 3, total: 6, mcq: 1, saqs: 2, laqs: 0 },
    { id: 'sample-2', attemptedAt: '2026-09-10T10:00:00Z', obtained: 5, total: 6, mcq: 1, saqs: 4, laqs: 0 },
  ] }],
}

/** Async adapter for future API integration. @returns {Promise<ReturnType<typeof buildCompetencyAnalytics>>} */
export async function getCompetencyAnalytics(card) {
  const sources = []
  if (typeof window !== 'undefined') {
    for (const key of ['vx-question-bank-published-questions', 'vx-question-bank-uploaded-questions', 'vx-question-bank-questions']) {
      try {
        const records = JSON.parse(window.localStorage.getItem(key) || '[]')
        if (Array.isArray(records)) sources.push(...records)
      } catch { /* A damaged storage entry must not prevent analytics from loading. */ }
    }
  }
  return buildCompetencyAnalytics(card, sources)
}
