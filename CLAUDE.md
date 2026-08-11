# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm test                      # full suite (the script carries its own 'src/**/*.spec.ts' glob)
pnpm build                     # tsc -> lib/ (ESM + .d.ts + both sourcemap kinds)
pnpm typecheck                 # tsc --noEmit
pnpm lint                      # oxlint
pnpm format                    # oxfmt (--check in CI, via `pnpm format:check`)
```

A single file, or a single test by name, is run by invoking the test runner directly, since the
`test` script's own glob would otherwise be added to whatever is passed:

```bash
node --experimental-strip-types --test src/chord.spec.ts
node --experimental-strip-types --test src/chord.spec.ts --test-name-pattern 'inversion'
```

Requires Node >= 24 — tests run TypeScript directly via `--experimental-strip-types`, with
`--experimental-test-isolation=none` (all spec files share one process).

Style tooling is oxlint and oxfmt (120 cols, single quotes, import sorting), configured in
`oxlint.config.ts` and `oxfmt.config.ts`. The package keeps its own configuration rather than
inheriting one: it is a standalone repository, vendored into consumers as a subtree. Both tools
read `.gitignore`, so neither needs to be told about `lib/`; `oxfmt .` also covers the JSON and
Markdown at the root.

## Architecture

A published library (`@nilscox/music-tools`) of four music theory value classes.
`src/index.ts` re-exports all of them; `src/utils.ts` holds only `assert`.

All four are **deeply immutable**: fields are `readonly` and every constructor ends with
`Object.freeze(this)` (`Chord` also freezes its copy of the intervals array, and `Key` freezes its
two static accidental orders). Nothing mutates an instance in place — derive new ones with
`Note.with({...})` or by constructing. Because freezing routes every change back through a
constructor, the invariants below can't be bypassed after creation.

The dependency direction is **Chord → Interval ⇄ Note ← Key**. `Note` and `Interval` are mutually
recursive: `Note.transpose` consumes an `Interval`, and `Interval.fromNotes` calls
`Note.transpose` to derive quality. Keep that cycle in mind when changing either — and note that
`note.ts` imports `Interval` with `import type` only, so nothing in `Note` may use it as a value.

### The shared constructor pattern

All four classes use the same idiom, and new classes should follow it:

- Several `constructor` overload signatures are declared, then a single implementation whose
  parameters are typed as `Parameters<typeof X.from>[0]`.
- A private static `from(args)` narrows the argument tuple to one canonical shape, delegating to
  private `fromString` / `fromMidi` / `fromSemitones` / `fromNotes` helpers.
- Validation happens in the implementation constructor via `assert`, which throws `Error` — invalid
  input is never silently coerced. Tests assert on these throws.

### Domain invariants worth knowing

- **Note** — pitch class + alteration (−2..2) + _optional_ octave (−1..9). An absent octave means
  "pitch class only": `equals` compares pitch class and alteration, and `midi` falls back to
  octave 4. `transpose` walks the letter names first and derives the alteration from the semitone
  difference, so enharmonic spelling is preserved (`Note('C').transpose(Interval('A4'))` is `F#`,
  not `Gb`). `transpose` takes a `direction` rather than intervals becoming signed, which would
  have to be threaded through `semitones`, `simple`, `invert` and `Chord`. `isEnharmonic` answers
  what `equals` deliberately does not — same pitch, different spelling — so an identical spelling
  is **not** enharmonic; when either note lacks an octave it compares pitch classes modulo 12,
  since `midi` would otherwise put `B#` an octave above `C` instead of beside it.
- **Interval** — quality + number, where the number can exceed 7 (compound intervals). Numbers are
  1-based diatonic degrees, so an octave adds **7**, not 12 — the trap `fromSemitones` fell into.
  Quality validity depends on whether the degree is perfect (1/4/5) or imperfect (2/3/6/7), and so
  does the size of a diminished interval (one semitone below minor when imperfect, one below
  perfect otherwise). Every such check must go through `Interval.degree()` / `Interval.isPerfect()`
  rather than testing `this.number` directly, which is only correct below an octave.
  A simple interval spans at most one octave **inclusive**, so `simple()` reduces whole octaves to
  an 8th rather than a unison: `P8` → `P8`, `P15` → `P8`, but `m9` → `m2`.
  `new Interval(a, b)` is **ascending only**: it requires `b` to be at or above `a` both in letter
  and in pitch, and throws a descending-interval error otherwise. It derives quality from the
  semitone distance to the perfect/major interval of the same degree, which covers `dd`..`AA`;
  anything wider (`Fb` to `B#`) is rejected with a message naming the notes.
  The constructor's string overload is typed `` `${IntervalQuality}${number}` ``, which no plain
  `string` satisfies — `Interval.parse` is the entry point for one, with the same validation.
- **Chord** — a root `Note` plus an **ordered** `Interval[]`. Order encodes the inversion: rotating
  the array (`invert`) is the inversion, and `rootIndex`/`inversion` are derived from where `P1`
  sits. `quality` is a reverse lookup that only matches after `toRootPosition()`, so it returns
  `undefined` for any interval set not in the table.
- **Key** — a tonic `Note` (never with an octave) + a mode, and everything derived from the pair's
  position on the circle of fifths. The `tonics` table in `src/key.ts` holds the 15 tonics of each
  mode indexed by that position offset by `center` (7), so the index _is_ the signature, two tonics
  at the same index are relatives, and absence from a row is the validation — there is no separate
  list of legal keys. `relative` always exists; `parallel` and `enharmonic` return `undefined` past
  the 15, so `Cb major` has no parallel and `C major` no enharmonic. Scale degrees and note
  derivation stay out: they are `Scale`'s.

Chord qualities live in a `chordsRef` literal at the top of `src/chord.ts` (kept `// oxfmt-ignore`
for alignment) and are parsed into `Interval` objects once in a private static. `Chord.aliases` maps
symbols (`°`, `+`, `ø`, `sus`, `''`) onto canonical qualities, and the chord-name regex is generated
from both tables, sorted longest-first so alternation matches `m7` before `m` — adding a quality to
`chordsRef` automatically extends string parsing, including slash-chord (`C/E`) support.

## TypeScript constraints

`tsconfig.json` is strict with several settings that shape the code:

- `erasableSyntaxOnly` — no enums, no parameter properties, no namespaces (required for
  `--experimental-strip-types`).
- `rewriteRelativeImportExtensions` + `verbatimModuleSyntax` — relative imports **must** carry the
  `.ts` extension (`./note.ts`), and type-only imports **must** use `import type`.
- `noUncheckedIndexedAccess` and `noPropertyAccessFromIndexSignature` — hence the pervasive `!`
  after array/record lookups and `match.groups['root']` bracket syntax.
