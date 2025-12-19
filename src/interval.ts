import { Note } from './note.ts';
import { assert } from './utils.ts';

export type IntervalQuality = 'P' | 'm' | 'M' | 'd' | 'dd' | 'A' | 'AA';

export class Interval {
  public number: number;
  public quality: IntervalQuality;

  constructor(quality: IntervalQuality, number: number);

  constructor(interval: Interval);
  constructor(value: `${IntervalQuality}${number}`);
  constructor(semitones: number);
  constructor(a: Note, b: Note);

  constructor(...args: Parameters<typeof Interval.from>[0]) {
    const [quality, number] = Interval.from(args);

    assert(number > 0, `Invalid interval number: ${number}`);

    if ([1, 4, 5].includes(((number - 1) % 7) + 1)) {
      assert(['P', 'A', 'AA', 'd', 'dd'].includes(quality), `Invalid interval quality: ${quality}`);
    }

    if ([2, 3, 6, 7].includes(((number - 1) % 7) + 1)) {
      assert(['M', 'm', 'A', 'AA', 'd', 'dd'].includes(quality), `Invalid interval quality: ${quality}`);
    }

    this.number = number;
    this.quality = quality;
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

    return [quality, number + 12 * Math.floor(semitones / 12)];
  }

  private static fromNotes(a: Note, b: Note): [IntervalQuality, number] {
    const octave = (b.octave ?? 4) - (a.octave ?? 4);
    const number = 'CDEFGAB'.indexOf(b.pitchClass) - 'CDEFGAB'.indexOf(a.pitchClass) + 1 + 7 * octave;

    const getQuality = () => {
      const interval = new Interval([1, 4, 5].includes(number % 7) ? 'P' : 'M', number);
      const diff = (b.midi - a.transpose(interval).midi) % 12;

      if (diff === 1) {
        return 'A';
      }

      if (diff === -1) {
        if (interval.quality === 'M') {
          return 'm';
        } else {
          return 'd';
        }
      }

      assert(diff == 0);

      return interval.quality;
    };

    return [getQuality(), number];
  }

  static isQuality(value: string): value is IntervalQuality {
    return ['P', 'm', 'M', 'd', 'dd', 'A', 'AA'].includes(value);
  }

  get semitones(): number {
    const number = ((this.number - 1) % 7) + 1;
    const octave = Math.floor((this.number - 1) / 7);

    let semitones = {
      1: 0,
      2: 2,
      3: 4,
      4: 5,
      5: 7,
      6: 9,
      7: 11,
    }[number];

    assert(semitones !== undefined);

    if (this.quality === 'm') semitones -= 1;

    if (this.quality === 'd') semitones -= 1;
    if (this.quality === 'dd') semitones -= 2;

    if (this.quality === 'A') semitones += 1;
    if (this.quality === 'AA') semitones += 2;

    if ([2, 3, 6, 7].includes(this.number)) {
      if (this.quality === 'dd' || this.quality === 'd') {
        semitones -= 1;
      }
    }

    semitones += 12 * octave;

    return semitones;
  }

  equals(other?: unknown) {
    return other instanceof Interval && this.number === other.number && this.quality === other.quality;
  }

  toString(): string {
    return `${this.quality}${this.number}`;
  }

  simple() {
    const number = ((this.number - 1) % 7) + 1;

    return new Interval(this.quality, this.number === 8 ? 8 : number);
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
