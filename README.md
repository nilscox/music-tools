# music-tools

Utilities for music stuff: a small TypeScript library of three music theory classes — `Note`,
`Interval` and `Chord`.

Each one parses from a handful of representations (strings like `C#4`, `m7` or `Cmaj7`, MIDI
numbers, semitone counts) and knows how to transpose, invert and compare itself. Spelling is
preserved rather than normalized, so `C` transposed by an augmented fourth gives `F#`, not `Gb`.

```ts
import { Chord, Interval, Note } from '@nilscox/music-tools';

new Note('C4').transpose(new Interval('M3')).toString(); // 'E4'
new Chord('Am7').notes.map(String); // ['A', 'C', 'E', 'G']
new Chord('C/E').inversion; // 1
```

## Install

```sh
pnpm add @nilscox/music-tools
```
