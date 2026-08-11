# music-tools

Utilities for music stuff: a small TypeScript library of four music theory classes — `Note`,
`Interval`, `Chord` and `Key`.

Each one parses from a handful of representations (strings like `C#4`, `m7`, `Cmaj7` or `Eb major`,
MIDI numbers, semitone counts) and knows how to transpose, invert and compare itself. Spelling is
preserved rather than normalized, so `C` transposed by an augmented fourth gives `F#`, not `Gb`.

```ts
import { Chord, Interval, Key, Note } from '@nilscox/music-tools';

new Note('C4').transpose(new Interval('M3')).toString(); // 'E4'
new Note('C4').transpose(new Interval('M3'), 'down').toString(); // 'Ab3'
new Note('C#').isEnharmonic(new Note('Db')); // true
new Chord('Am7').notes.map(String); // ['A', 'C', 'E', 'G']
new Chord('C/E').inversion; // 1
new Key('Eb major').accidentals.map(String); // ['Bb', 'Eb', 'Ab']
new Key('Eb major').relative.toString(); // 'C minor'
```

## Install

```sh
pnpm add @nilscox/music-tools
```
