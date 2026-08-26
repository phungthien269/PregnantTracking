'use client'

import { useState } from 'react'
import { Badge, Button, Card, EmptyState } from '@mevabe/ui'
import type { QuizQuestion } from '@mevabe/domain'
import { QuizReportButton } from '@/components/QuizReportButton'

/** Làm trắc nghiệm/tình huống cho một bộ quiz; ôn lại câu sai sau khi xong. */
export function QuizRunner({ setTitle, questions }: { setTitle: string; questions: QuizQuestion[] }) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [done, setDone] = useState(false)

  if (!questions.length) return <EmptyState title="Chưa có câu hỏi" description="Bộ quiz này chưa có câu hỏi để làm." />

  const question = questions[idx]!
  const score = answers.filter((a, i) => a === questions[i]?.correct_index).length
  const wrong = questions
    .map((question, i) => ({ question, user: answers[i] ?? null, correct: question.correct_index }))
    .filter((x) => x.user !== null && x.user !== x.correct)

  if (done) {
    return (
      <Card title="Kết quả">
        <p className="text-sm text-fg">
          Mẹ trả lời đúng <strong>{score}/{questions.length}</strong> câu.
        </p>
        {wrong.length ? (
          <div className="mt-3">
            <p className="text-sm font-medium text-fg">Ôn câu sai:</p>
            <ul className="mt-2 space-y-2">
              {wrong.map((w) => (
                <li key={w.question.id} className="rounded-md bg-surface-muted p-3 text-sm">
                  <p className="text-fg">{w.question.prompt}</p>
                  <p className="mt-1 text-xs text-muted">
                    Mẹ chọn: {w.question.options[w.user!] ?? '—'} · Đáp án đúng:{' '}
                    <span className="font-medium text-success">{w.question.options[w.correct]}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-sm text-success">Tuyệt vời! Đúng hết rồi 🌟</p>
        )}
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => {
            setIdx(0)
            setAnswers([])
            setDone(false)
          }}
        >
          Làm lại
        </Button>
      </Card>
    )
  }

  return (
    <Card title={`Quiz: ${setTitle}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge tone="primary">
          Câu {idx + 1}/{questions.length}
        </Badge>
        <QuizReportButton questionId={question.id} />
      </div>
      <p className="text-sm font-medium text-fg">{question.prompt}</p>
      <div className="mt-3 space-y-2">
        {question.options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              setAnswers((prev) => [...prev, i])
              if (idx + 1 >= questions.length) setDone(true)
              else setIdx(idx + 1)
            }}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-left text-sm text-fg hover:bg-surface-muted"
          >
            {opt}
          </button>
        ))}
      </div>
    </Card>
  )
}
