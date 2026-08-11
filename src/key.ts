import { Note, type PitchClass } from './note.ts';
import { assert } from './utils.ts';

export type KeyMode = 'major' | 'minor';

export type KeySignature = {
  count: number;
  accidental?: 'sharp' | 'flat';
};

// each row is indexed by its tonic's position on the circle of fifths, offset by `center`
// oxfmt-ignore
const tonics: Record<KeyMode, string[]> = {
  major: ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A',  'E',  'B',  'F#', 'C#'],
  minor: ['Ab', 'Eb', 'Bb', 'F',  'C',  'G',  'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'],
};

const center = 7;

const parallelDistance = 3;

export class Key {
  public readonly tonic: Note;
  public readonly mode: KeyMode;

  constructor(key: Key);
  constructor(value: string);
  constructor(tonic: Note, mode: KeyMode);
  constructor(tonic: string, mode: KeyMode);

  constructor(...args: Parameters<typeof Key.from>[0]) {
    const [tonic, mode] = Key.from(args);

    assert(tonic.octave === undefined, `A key has no octave: ${tonic}`);
    assert(Key.isMode(mode), `Invalid key mode: ${mode}`);
    assert(tonics[mode].includes(tonic.toString()), `Invalid ${mode} key: ${tonic}`);

    this.tonic = tonic;
    this.mode = mode;

    Object.freeze(this);
  }

  private static from(args: [Key] | [string] | [Note, KeyMode] | [string, KeyMode]): [Note, KeyMode] {
    if (args.length === 2) {
      const [tonic, mode] = args;

      return [typeof tonic === 'string' ? new Note(tonic) : tonic, mode];
    }

    if (args[0] instanceof Key) {
      return [args[0].tonic, args[0].mode];
    }

    return Key.fromString(args[0]);
  }

  private static fromString(value: string): [Note, KeyMode] {
    const match = /^([A-G](?:#|##|b|bb)?) (major|minor)$/.exec(value);

    assert(match, `Invalid key: ${value}`);

    const [, tonic, mode] = match;

    assert(tonic);
    assert(mode && Key.isMode(mode));

    return [new Note(tonic), mode];
  }

  static isMode(value: string): value is KeyMode {
    return value === 'major' || value === 'minor';
  }

  static readonly sharpOrder: readonly PitchClass[] = Object.freeze(['F', 'C', 'G', 'D', 'A', 'E', 'B'] as const);

  static readonly flatOrder: readonly PitchClass[] = Object.freeze(Key.sharpOrder.toReversed());

  static fromFifths(fifths: number, mode: KeyMode): Key {
    const key = Key.at(fifths, mode);

    assert(key, `No ${mode} key at ${fifths} fifths`);

    return key;
  }

  private static at(fifths: number, mode: KeyMode): Key | undefined {
    assert(Key.isMode(mode), `Invalid key mode: ${mode}`);

    const tonic = tonics[mode][fifths + center];

    return tonic === undefined ? undefined : new Key(tonic, mode);
  }

  get fifths(): number {
    return tonics[this.mode].indexOf(this.tonic.toString()) - center;
  }

  get signature(): KeySignature {
    const fifths = this.fifths;

    if (fifths === 0) {
      return { count: 0 };
    }

    return { count: Math.abs(fifths), accidental: fifths > 0 ? 'sharp' : 'flat' };
  }

  get accidentals(): Note[] {
    const { count, accidental } = this.signature;
    const order = accidental === 'flat' ? Key.flatOrder : Key.sharpOrder;

    return order
      .slice(0, count)
      .map((pitchClass) => new Note(pitchClass, { alteration: accidental === 'flat' ? -1 : 1 }));
  }

  get relative(): Key {
    return Key.fromFifths(this.fifths, this.otherMode);
  }

  get parallel(): Key | undefined {
    const distance = this.mode === 'major' ? -parallelDistance : parallelDistance;

    return Key.at(this.fifths + distance, this.otherMode);
  }

  get enharmonic(): Key | undefined {
    // Math.sign(0) is 0, which would make the two keys without a signature their own enharmonic
    if (this.fifths === 0) {
      return undefined;
    }

    return Key.at(this.fifths - Math.sign(this.fifths) * 12, this.mode);
  }

  equals(other?: unknown) {
    return other instanceof Key && this.mode === other.mode && this.tonic.equals(other.tonic);
  }

  toString(): string {
    return `${this.tonic} ${this.mode}`;
  }

  private get otherMode(): KeyMode {
    return this.mode === 'major' ? 'minor' : 'major';
  }
}
