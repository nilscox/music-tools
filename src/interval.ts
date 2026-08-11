import { Note } from './note.ts';
import { assert } from './utils.ts';

export type IntervalQuality = 'P' | 'm' | 'M' | 'd' | 'dd' | 'A' | 'AA';

export class Interval {
  public readonly number: number;
  public readonly quality: IntervalQuality;

  constructor(quality: IntervalQuality, number: number);

  constructor(interval: Interval);
  constructor(value: `${IntervalQuality}${number}`);
  constructor(semitones: number);
  constructor(a: Note, b: Note);

  constructor(...args: Parameters<typeof Interval.from>[0]) {
    const [quality, number] = Interval.from(args);

    assert(number > 0, `Invalid interval number: ${number}`);

    const qualities = Interval.isPerfect(number) ? ['P', 'A', 'AA', 'd', 'dd'] : ['M', 'm', 'A', 'AA', 'd', 'dd'];

    assert(qualities.includes(quality), `Invalid interval quality: ${quality}`);

    this.number = number;
    this.quality = quality;

    Object.freeze(this);
  }

  private static from(
    args: [Interval] | [IntervalQuality, number] | [`${IntervalQuality}${number}`] | [number] | [Note, Note],
  ): [IntervalQuality, number] {
    if (args.length === 1) {
      if (args[0] instanceof Interval) {
        return [args[0].quality, args[0].number];
      } else if (typeof args[0] === 'number') {
        return this.fromSemitones(args[0]);
      } else {
        return this.fromString(args[0]);
      }
    }

    if (typeof args[0] === 'string') {
      assert(this.isQuality(args[0]));
      return [args[0], args[1]];
    }

    assert(args[0] instanceof Note);
    assert(args[1] instanceof Note);

    return this.fromNotes(args[0], args[1]);
  }

  private static fromString(value: `${IntervalQuality}${number}`): [IntervalQuality, number] {
    const match = /^(P|M|m|A|AA|d|dd)(\d+)$/.exec(value);

    assert(match, `Invalid interval: ${value}`);
    assert(match[1] && Interval.isQuality(match[1]));

    return [match[1], Number(match[2])];
  }

  private static fromSemitones(semitones: number): [IntervalQuality, number] {
    assert(Number.isInteger(semitones) && semitones >= 0, `Invalid interval semitones: ${semitones}`);

    const map: Record<string, [IntervalQuality, number]> = {
      0: ['P', 1],
      1: ['m', 2],
      2: ['M', 2],
      3: ['m', 3],
      4: ['M', 3],
      5: ['P', 4],
      6: ['d', 5],
      7: ['P', 5],
      8: ['m', 6],
      9: ['M', 6],
      10: ['m', 7],
      11: ['M', 7],
    };

    const [quality, number] = map[semitones % 12]!;

    // an octave adds 7 to the diatonic degree, not 12
    return [quality, number + 7 * Math.floor(semitones / 12)];
  }

  private static fromNotes(a: Note, b: Note): [IntervalQuality, number] {
    const pitchClasses = 'CDEFGAB';

    const octave = (b.octave ?? 4) - (a.octave ?? 4);
    const number = pitchClasses.indexOf(b.pitchClass) - pitchClasses.indexOf(a.pitchClass) + 1 + 7 * octave;
    const descending = `Cannot compute a descending interval, from ${a} to ${b}`;

    assert(number > 0, descending);
    assert(b.midi >= a.midi, descending);

    const perfect = Interval.isPerfect(number);
    const delta = b.midi - a.midi - new Interval(perfect ? 'P' : 'M', number).semitones;

    // how far the pair sits from the perfect or major interval of the same degree
    const qualities: Record<number, IntervalQuality> = perfect
      ? { '-2': 'dd', '-1': 'd', 0: 'P', 1: 'A', 2: 'AA' }
      : { '-3': 'dd', '-2': 'd', '-1': 'm', 0: 'M', 1: 'A', 2: 'AA' };

    const quality = qualities[delta];

    assert(quality, `Interval from ${a} to ${b} is beyond doubly diminished or augmented`);

    return [quality, number];
  }

  static isQuality(value: string): value is IntervalQuality {
    return ['P', 'm', 'M', 'd', 'dd', 'A', 'AA'].includes(value);
  }

  // the degree within a single octave: 8 -> 1, 9 -> 2, 15 -> 1
  static degree(number: number): number {
    return ((number - 1) % 7) + 1;
  }

  static isPerfect(number: number): boolean {
    return [1, 4, 5].includes(Interval.degree(number));
  }

  get semitones(): number {
    const number = Interval.degree(this.number);
    const octave = Math.floor((this.number - 1) / 7);

    const semitones = {
      1: 0,
      2: 2,
      3: 4,
      4: 5,
      5: 7,
      6: 9,
      7: 11,
    }[number];

    assert(semitones !== undefined);

    // diminished sits one semitone below minor for imperfect intervals, one below perfect otherwise
    const perfect = Interval.isPerfect(this.number);

    const offsets: Record<IntervalQuality, number> = {
      P: 0,
      M: 0,
      m: -1,
      d: perfect ? -1 : -2,
      dd: perfect ? -2 : -3,
      A: 1,
      AA: 2,
    };

    return semitones + offsets[this.quality] + 12 * octave;
  }

  equals(other?: unknown) {
    return other instanceof Interval && this.number === other.number && this.quality === other.quality;
  }

  toString(): string {
    return `${this.quality}${this.number}`;
  }

  simple() {
    const number = Interval.degree(this.number);

    // a simple interval spans at most one octave, included: whole octaves reduce to an 8th, not a unison
    if (number === 1 && this.number > 1) {
      return new Interval(this.quality, 8);
    }

    return new Interval(this.quality, number);
  }

  invert() {
    const map: Record<IntervalQuality, IntervalQuality> = {
      P: 'P',
      m: 'M',
      M: 'm',
      A: 'd',
      AA: 'dd',
      d: 'A',
      dd: 'AA',
    };

    return new Interval(map[this.quality], 9 - this.simple().number);
  }
}
