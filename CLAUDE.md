# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm test 'src/**/*.spec.ts'   # full suite (the `test` script takes no file args of its own)
pnpm test src/chord.spec.ts    # single file
pnpm test src/chord.spec.ts --test-name-pattern 'inversion'   # single test/suite by name
pnpm build                     # vite build -> lib/ (ESM + rolled-up .d.ts + sourcemaps)
npx tsc --noEmit               # typecheck only
npx prettier --write src        # format (config lives in package.json)
```

Requires Node 25 — tests run TypeScript directly via `--experimental-strip-types`, with
`--experimental-test-isolation=none` (all spec files share one process).

There is no lint script; Prettier (120 cols, single quotes, `@trivago` import sorting) is the only
style tooling.

## Architecture

A published library (`@nilscox/music-tools`) of three immutable-ish music theory value classes.
`src/index.ts` re-exports all of them; `src/utils.ts` holds only `assert`.

The dependency direction is **Chord → Interval ⇄ Note**. `Note` and `Interval` are mutually
recursive: `Note.transpose` consumes an `Interval`, and `Interval.fromNotes` calls
`Note.transpose` to derive quality. Keep that cycle in mind when changing either.

### The shared constructor pattern

All three classes use the same idiom, and new classes should follow it:

- Several `constructor` overload signatures are declared, then a single implementation whose
  parameters are typed as `Parameters<typeof X.from>[0]`.
- A private static `from(args)` narrows the argument tuple to one canonical shape, delegating to
  private `fromString` / `fromMidi` / `fromSemitones` / `fromNotes` helpers.
- Validation happens in the implementation constructor via `assert`, which throws `Error` — invalid
  input is never silently coerced. Tests assert on these throws.

### Domain invariants worth knowing

- **Note** — pitch class + alteration (−2..2) + *optional* octave (−1..9). An absent octave means
  "pitch class only": `equals` compares pitch class and alteration, and `midi` falls back to
  octave 4. `transpose` walks the letter names first and derives the alteration from the semitone
  difference, so enharmonic spelling is preserved (`Note('C').transpose(Interval('A4'))` is `F#`,
  not `Gb`).
- **Interval** — quality + number, where the number can exceed 7 (compound intervals). Quality
  validity depends on whether the simple number is perfect (1/4/5) or imperfect (2/3/6/7);
  `semitones` and `invert` both fold compounds back through `simple()`.
- **Chord** — a root `Note` plus an **ordered** `Interval[]`. Order encodes the inversion: rotating
  the array (`invert`) is the inversion, and `rootIndex`/`inversion` are derived from where `P1`
  sits. `quality` is a reverse lookup that only matches after `toRootPosition()`, so it returns
  `undefined` for any interval set not in the table.

Chord qualities live in a `chordsRef` literal at the top of `src/chord.ts` (kept `// prettier-ignore`
for alignment) and are parsed into `Interval` objects once in a private static. `Chord.aliases` maps
symbols (`°`, `+`, `ø`, `sus`, `''`) onto canonical qualities, and the chord-name regex is generated
from both tables — adding a quality to `chordsRef` automatically extends string parsing, including
slash-chord (`C/E`) support.

Note: `src/chords.json` duplicates the `chordsRef` table but is imported by nothing. Edit
`src/chord.ts`; the JSON file is dead weight unless you deliberately wire it up.

## TypeScript constraints

`tsconfig.json` is strict with several settings that shape the code:

- `erasableSyntaxOnly` — no enums, no parameter properties, no namespaces (required for
  `--experimental-strip-types`).
- `rewriteRelativeImportExtensions` + `verbatimModuleSyntax` — relative imports **must** carry the
  `.ts` extension (`./note.ts`), and type-only imports **must** use `import type`.
- `noUncheckedIndexedAccess` and `noPropertyAccessFromIndexSignature` — hence the pervasive `!`
  after array/record lookups and `match.groups['root']` bracket syntax.
