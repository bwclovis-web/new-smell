import { useEffect, useState } from "react"
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router"
import { Form, Link, useActionData, useLoaderData } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import CheckBox from "~/components/Atoms/CheckBox/CheckBox"
import { CSRFToken } from "~/components/Molecules/CSRFToken"
import TitleBanner from "~/components/Organisms/TitleBanner/TitleBanner"
import {
  updateScentProfileFromQuiz,
  type ScentQuizData,
} from "~/models/scent-profile.server"
import { getAllTags } from "~/models/tags.server"
import { sharedLoader } from "~/utils/sharedLoader"

import banner from "~/images/scent.webp"

export const ROUTE_PATH = "/scent-quiz"

const STEPS = [
  "welcome",
  "note-preferences",
  "avoid-notes",
  "season",
  "browsing-style",
] as const
type StepId = (typeof STEPS)[number]

function parseStep(value: string | null): StepId {
  if (value && STEPS.includes(value as StepId)) return value as StepId
  return "welcome"
}

const SEASON_OPTIONS: {
  value: "spring" | "summer" | "fall" | "winter"
  label: string
}[] = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "winter", label: "Winter" },
]

const BROWSING_OPTIONS: {
  value: "explorer" | "focused" | "trader"
  label: string
}[] = [
  { value: "explorer", label: "Explorer – I like to discover new scents" },
  { value: "focused", label: "Focused – I know what I like" },
  { value: "trader", label: "Trader – I swap and trade often" },
]

const MIN_NOTE_SELECTIONS = 3
const MAX_NOTE_SELECTIONS = 7

const Q = {
  step: "step",
  noteIds: "noteIds",
  avoidNoteIds: "avoidNoteIds",
  season: "season",
  browsingStyle: "browsingStyle",
} as const

export const meta: MetaFunction = () => [
  { title: "Scent Quiz - Shadow and Sillage" },
  {
    name: "description",
    content:
      "Tell us your scent preferences so we can recommend perfumes you'll love.",
  },
]

const VALID_SEASONS = ["spring", "summer", "fall", "winter"] as const
type SeasonId = (typeof VALID_SEASONS)[number]

type LoaderData = {
  step: StepId
  notes: { id: string; name: string }[]
  initialNoteIds: string[]
  initialAvoidIds: string[]
  initialSeasonIds: string[]
  initialBrowsingStyle: string
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await sharedLoader(request)
  const url = new URL(request.url)
  const step = parseStep(url.searchParams.get(Q.step))
  const notes = await getAllTags()

  return {
    step,
    notes: notes.map((n) => ({ id: n.id, name: n.name })),
    initialNoteIds: url.searchParams.get(Q.noteIds)?.split(",").filter(Boolean) ?? [],
    initialAvoidIds: url.searchParams.get(Q.avoidNoteIds)?.split(",").filter(Boolean) ?? [],
    initialSeasonIds:
      url.searchParams.get(Q.season)?.split(",").filter((s) => VALID_SEASONS.includes(s as SeasonId)) ?? [],
    initialBrowsingStyle: url.searchParams.get(Q.browsingStyle) ?? "",
  } satisfies LoaderData
}

type ActionData = { success: true; error?: never } | { success?: never; error: string }

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  const formData = await request.formData()
  const { requireCSRF } = await import("~/utils/server/csrf.server")
  await requireCSRF(request, formData)

  const user = await sharedLoader(request)

  const noteIds = formData.getAll("noteIds").filter((v): v is string => typeof v === "string")
  const avoidNoteIds = formData
    .getAll("avoidNoteIds")
    .filter((v): v is string => typeof v === "string")
  const seasonIdsRaw = formData.getAll("season").filter((v): v is string => typeof v === "string")
  const seasonHints = seasonIdsRaw.filter((s) => VALID_SEASONS.includes(s as SeasonId)) as SeasonId[]
  const browsingStyle = formData.get("browsingStyle") as
    | ""
    | "explorer"
    | "focused"
    | "trader"
    | null

  if (noteIds.length < MIN_NOTE_SELECTIONS) {
    return {
      error: `Please select at least ${MIN_NOTE_SELECTIONS} notes you like.`,
    } satisfies ActionData
  }
  if (noteIds.length > MAX_NOTE_SELECTIONS) {
    return {
      error: `Please select at most ${MAX_NOTE_SELECTIONS} notes.`,
    } satisfies ActionData
  }

  const noteWeights: Record<string, number> = {}
  for (const id of noteIds) {
    noteWeights[id] = 1
  }

  const quizData: ScentQuizData = {
    noteWeights,
    avoidNoteIds: avoidNoteIds.length > 0 ? avoidNoteIds : undefined,
    seasonHints: seasonHints.length > 0 ? seasonHints : undefined,
    browsingStyle:
      browsingStyle && browsingStyle !== ""
        ? (browsingStyle as "explorer" | "focused" | "trader")
        : null,
  }

  await updateScentProfileFromQuiz(user.id, quizData)

  return { success: true } satisfies ActionData
}

/** Build step URL with current form params for SSR/bookmarkable steps */
function stepUrl(
  step: StepId,
  params: {
    noteIds: string[]
    avoidIds: string[]
    seasonIds: string[]
    browsingStyle: string
  }
): string {
  const sp = new URLSearchParams()
  sp.set(Q.step, step)
  if (params.noteIds.length) sp.set(Q.noteIds, params.noteIds.join(","))
  if (params.avoidIds.length) sp.set(Q.avoidNoteIds, params.avoidIds.join(","))
  if (params.seasonIds.length) sp.set(Q.season, params.seasonIds.join(","))
  if (params.browsingStyle) sp.set(Q.browsingStyle, params.browsingStyle)
  return `${ROUTE_PATH}?${sp.toString()}`
}

export default function ScentQuizPage() {
  const loaderData = useLoaderData<LoaderData>()
  const { step, notes, initialNoteIds, initialAvoidIds, initialSeasonIds, initialBrowsingStyle } = loaderData
  const actionData = useActionData<ActionData>()
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(() => new Set(initialNoteIds))
  const [avoidNoteIds, setAvoidNoteIds] = useState<Set<string>>(() => new Set(initialAvoidIds))
  const [selectedSeasonIds, setSelectedSeasonIds] = useState<Set<string>>(
    () => new Set(initialSeasonIds ?? [])
  )
  const [browsingStyle, setBrowsingStyle] = useState<
    "explorer" | "focused" | "trader" | ""
  >(initialBrowsingStyle as "explorer" | "focused" | "trader" | "" || "")

  // Sync state from URL when loader data changes (SSR/navigation/refresh)
  useEffect(() => {
    setSelectedNoteIds(new Set(initialNoteIds ?? []))
    setAvoidNoteIds(new Set(initialAvoidIds ?? []))
    setSelectedSeasonIds(new Set(initialSeasonIds ?? []))
    setBrowsingStyle((initialBrowsingStyle as "explorer" | "focused" | "trader") || "")
  }, [
    (initialNoteIds ?? []).join(","),
    (initialAvoidIds ?? []).join(","),
    (initialSeasonIds ?? []).join(","),
    initialBrowsingStyle,
  ])

  const stepParams = {
    noteIds: Array.from(selectedNoteIds),
    avoidIds: Array.from(avoidNoteIds),
    seasonIds: Array.from(selectedSeasonIds),
    browsingStyle,
  }

  const toggleSeason = (value: SeasonId) => {
    setSelectedSeasonIds((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const toggleNote = (id: string, isAvoid: boolean) => {
    if (isAvoid) {
      setAvoidNoteIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    } else {
      setSelectedNoteIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else if (next.size < MAX_NOTE_SELECTIONS) next.add(id)
        return next
      })
    }
  }

  if (actionData?.success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <TitleBanner image={banner} heading="You're all set!" />
        <p className="mt-6 text-lg text-stone-300">
          We'll use your preferences to recommend perfumes you'll love.
        </p>
        <Button asChild variant="primary" className="mt-8">
          <Link to="/">Go to home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <TitleBanner
        image={banner}
        heading="Scent quiz"
        subheading="Help us personalize your experience (optional)"
      />

      {step === "welcome" && (
        <div className="mt-8 space-y-6">
          <p className="text-stone-300">
            Answer a few quick questions about the notes and styles you like.
            You can skip this and we'll learn from your ratings and collection
            instead.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="primary">
              <Link to={stepUrl("note-preferences", stepParams)}>Start quiz</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/">Skip for now</Link>
            </Button>
          </div>
        </div>
      )}

      {step === "note-preferences" && (
        <div className="mt-8">
          <p className="mb-4 text-stone-300">
            Pick 3–{MAX_NOTE_SELECTIONS} note families you like (e.g. floral,
            woody, citrus).
          </p>
          <div className="flex max-h-80 flex-wrap gap-3 overflow-y-auto rounded border border-stone-600 bg-stone-800/50 p-4">
            {notes.map((note) => (
              <CheckBox
                key={note.id}
                label={note.name}
                checked={selectedNoteIds.has(note.id)}
                onChange={() => toggleNote(note.id, false)}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-stone-400">
            Selected: {selectedNoteIds.size} / {MAX_NOTE_SELECTIONS}
          </p>
          <div className="mt-6 flex gap-4">
            <Button asChild variant="secondary">
              <Link to={stepUrl("welcome", stepParams)}>Back</Link>
            </Button>
            {selectedNoteIds.size >= MIN_NOTE_SELECTIONS ? (
              <Button asChild variant="primary">
                <Link to={stepUrl("avoid-notes", stepParams)}>Next</Link>
              </Button>
            ) : (
              <Button type="button" variant="primary" disabled>
                Next
              </Button>
            )}
          </div>
        </div>
      )}

      {step === "avoid-notes" && (
        <div className="mt-8">
          <p className="mb-4 text-stone-300">
            Any notes you'd rather avoid? (optional)
          </p>
          <div className="flex max-h-64 flex-wrap gap-3 overflow-y-auto rounded border border-stone-600 bg-stone-800/50 p-4">
            {notes.map((note) => (
              <CheckBox
                key={note.id}
                label={note.name}
                checked={avoidNoteIds.has(note.id)}
                onChange={() => toggleNote(note.id, true)}
              />
            ))}
          </div>
          <div className="mt-6 flex gap-4">
            <Button asChild variant="secondary">
              <Link to={stepUrl("note-preferences", stepParams)}>Back</Link>
            </Button>
            <Button asChild variant="primary">
              <Link to={stepUrl("season", stepParams)}>Next</Link>
            </Button>
          </div>
        </div>
      )}

      {step === "season" && (
        <div className="mt-8">
          <p className="mb-4 text-stone-300">
            When do you wear fragrance most? (optional, select all that apply)
          </p>
          <div className="space-y-2">
            {SEASON_OPTIONS.map((opt) => (
              <CheckBox
                key={opt.value}
                label={opt.label}
                checked={selectedSeasonIds.has(opt.value)}
                onChange={() => toggleSeason(opt.value)}
              />
            ))}
          </div>
          <div className="mt-6 flex gap-4">
            <Button asChild variant="secondary">
              <Link to={stepUrl("avoid-notes", stepParams)}>Back</Link>
            </Button>
            <Button asChild variant="primary">
              <Link to={stepUrl("browsing-style", stepParams)}>Next</Link>
            </Button>
          </div>
        </div>
      )}

      {step === "browsing-style" && (
        <Form method="post" className="mt-8">
          <CSRFToken />
          {Array.from(selectedNoteIds).map((id) => (
            <input key={id} type="hidden" name="noteIds" value={id} />
          ))}
          {Array.from(avoidNoteIds).map((id) => (
            <input key={id} type="hidden" name="avoidNoteIds" value={id} />
          ))}
          {Array.from(selectedSeasonIds).map((id) => (
            <input key={id} type="hidden" name="season" value={id} />
          ))}
          <input type="hidden" name="browsingStyle" value={browsingStyle} />

          <p className="mb-4 text-stone-300">
            How do you like to browse? (optional)
          </p>
          <div className="space-y-2">
            {BROWSING_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-3 rounded border border-stone-600 bg-stone-800/50 px-4 py-2 hover:bg-stone-700/50"
              >
                <input
                  type="radio"
                  name="browsingStyle"
                  value={opt.value}
                  checked={browsingStyle === opt.value}
                  onChange={() => setBrowsingStyle(opt.value)}
                  className="h-4 w-4"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          {actionData?.error && (
            <p className="mt-4 text-red-400" role="alert">
              {actionData.error}
            </p>
          )}

          <div className="mt-6 flex gap-4">
            <Button asChild variant="secondary">
              <Link to={stepUrl("season", stepParams)}>Back</Link>
            </Button>
            <Button type="submit" variant="primary">Save preferences</Button>
          </div>
        </Form>
      )}
    </div>
  )
}
