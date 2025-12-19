import { Interval, type IntervalQuality } from './interval.ts';
import { Note } from './note.ts';
import { assert } from './utils.ts';

// prettier-ignore
const chordsRef = {
  'M':        ['P1', 'M3', 'P5'],
  'm':        ['P1', 'm3', 'P5'],
  'dim':      ['P1', 'm3', 'd5'],
  'aug':      ['P1', 'M3', 'A5'],
  'sus2':     ['P1', 'M2', 'P5'],
  'sus4':     ['P1', 'P4', 'P5'],
  '7':        ['P1', 'M3', 'P5', 'm7'],
  'maj7':     ['P1', 'M3', 'P5', 'M7'],
  'm7':       ['P1', 'm3', 'P5', 'm7'],
  'm(maj7)':  ['P1', 'm3', 'P5', 'M7'],
  'm7b5':     ['P1', 'm3', 'd5', 'm7'],
  'dim7':     ['P1', 'm3', 'd5', 'd7'],
  'aug7':     ['P1', 'M3', 'A5', 'm7'],
  'maj7(#5)': ['P1', 'M3', 'A5', 'M7'],
  '7(b5)':    ['P1', 'M3', 'd5', 'm7'],
  'maj7(b5)': ['P1', 'M3', 'd5', 'M7']
}

export type ChordQuality = keyof typeof chordsRef;

export class Chord {
  public root: Note;
  public intervals: Interval[];

  private static chordsRef = Object.entries(chordsRef).reduce(
    (obj, [name, intervals]) => ({
      ...obj,
      [name]: intervals.map((name) => new Interval(name as `${IntervalQuality}${number}`)),
    }),
    {} as Record<ChordQuality, Interval[]>,
  );

  private static aliases: Record<string, ChordQuality> = {
    '': 'M',
    '°': 'dim',
    '°7': 'dim7',
    '+': 'aug',
    '+7': 'aug7',
    ø: 'm7b5',
    sus: 'sus4',
  };

  constructor(chord: Chord);
  constructor(root: Note, quality: ChordQuality);
  constructor(root: Note, intervals: Interval[]);
  constructor(value: string, options?: { octave?: number });

  constructor(...args: Parameters<typeof Chord.from>[0]) {
    const [root, intervals] = Chord.from(args);

    assert(intervals.length >= 3, 'Invalid chord');

    assert(
      intervals.some((interval) => interval.equals(new Interval('P', 1))),
      'Invalid chord',
    );

    this.root = root;
    this.intervals = intervals;
  }

  private static from(
    args:
      | [chord: Chord]
      | [root: Note, quality: ChordQuality]
      | [root: Note, intervals: Interval[]]
      | [name: string, options?: { octave?: number }],
  ): [Note, Interval[]] {
    if (args[0] instanceof Chord) {
      return [args[0].root, args[0].intervals];
    }

    if (args[0] instanceof Note) {
      if (typeof args[1] === 'string' && Chord.isQuality(args[1])) {
        return [args[0], this.chordsRef[args[1]]!.slice()];
      }

      return args as [Note, Interval[]];
    }

    const name = args[0];
    const options = args[1] as { octave?: number } | undefined;

    return this.fromString(name, options?.octave);
  }

  private static get intervalRegExp() {
    const qualities = [...Object.keys(this.chordsRef), ...Object.keys(this.aliases)]
      .filter((key) => key !== '')
      .join('|')
      .replaceAll(/([+\(\)])/g, '\\$1');

    const note = '[A-G](bb|b|#|##)?';

    return new RegExp(`^(?<root>${note})(?<quality>${qualities})?(/(?<base>${note}))?$`);
  }

  private static fromString(name: string, octave?: number): [Note, Interval[]] {
    const match = this.intervalRegExp.exec(name);

    assert(match, `Invalid chord name ${name}`);
    assert(match.groups?.['root']);

    const root = new Note(match.groups['root']);
    const base = match.groups['base'] ? new Note(match.groups['base']) : null;

    if (octave !== undefined) {
      root.octave = octave;
    }

    let quality = match.groups['quality'] ?? '';

    if (quality in this.aliases) {
      quality = this.aliases[quality]!;
    }

    assert(this.isQuality(quality));

    const intervals = this.chordsRef[quality]!.slice();

    if (base) {
      const index = intervals.findIndex((interval) => root.transpose(interval).equals(base));

      assert(index >= 0, `Invalid base note ${base}`);

      for (let inversion = 1; inversion <= index; ++inversion) {
        intervals.push(intervals.shift()!);
      }
    }

    return [root, intervals];
  }

  static isQuality(value: string): value is ChordQuality {
    return Object.keys(this.chordsRef).includes(value);
  }

  get quality(): ChordQuality | undefined {
    const rootPosition = this.toRootPosition();

    for (const [quality, intervals] of Object.entries(Chord.chordsRef)) {
      if (intervals.length !== this.intervals.length) {
        continue;
      }

      if (intervals.every((interval, index) => rootPosition.intervals[index]!.equals(interval))) {
        return quality as ChordQuality;
      }
    }
  }

  toString(): string {
    const quality = this.quality;
    let result = this.root.pitchClass;

    if (quality !== 'M') {
      result += quality ?? '(?)';
    }

    if (this.inversion > 0) {
      result += '/' + this.root.transpose(this.intervals[0]!).pitchClass;
    }

    return result;
  }

  equals(other?: unknown) {
    return (
      other instanceof Chord &&
      this.root.equals(other.root) &&
      this.intervals.length === other.intervals.length &&
      this.intervals.every((interval, index) => interval.equals(other.intervals[index]!))
    );
  }

  get rootIndex(): number {
    return this.intervals.findIndex((interval) => interval.equals(new Interval('P', 1)));
  }

  get inversion(): number {
    return (this.intervals.length - this.rootIndex) % this.intervals.length;
  }

  invert(times = 1): Chord {
    const intervals = this.intervals.slice();

    for (let inversion = 1; inversion <= times % intervals.length; ++inversion) {
      intervals.push(intervals.shift()!);
    }

    return new Chord(this.root, intervals);
  }

  toRootPosition() {
    return this.invert(this.intervals.length - this.inversion);
  }

  get notes(): Note[] {
    const rootIndex = this.rootIndex;

    return this.intervals.map((interval, index) => {
      const note = this.root.transpose(interval);

      if (note.octave && index < rootIndex) {
        note.octave--;
      }

      return note;
    });
  }
}
