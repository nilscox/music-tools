import type { Interval } from './interval.ts';
import { assert } from './utils.ts';

export type PitchClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

type NoteAttributes = [PitchClass, { alteration?: number; octave?: number }?];

export class Note {
  public pitchClass: PitchClass;
  public alteration: number;
  public octave?: number;

  constructor(value: string);
  constructor(value: number);
  constructor(note: Note);
  constructor(...args: NoteAttributes);

  constructor(...args: Parameters<typeof Note.from>[0]) {
    const [pitchClass, { alteration = 0, octave } = {}] = Note.from(args);

    assert(Note.isPitchClass(pitchClass), `Invalid note pitch class ${pitchClass}`);
    assert(Number.isInteger(alteration), `Invalid note alteration ${alteration}`);
    assert(alteration >= -2 && alteration <= 2, `Invalid note alteration ${alteration}`);

    if (octave !== undefined) {
      assert(Number.isInteger(octave), `Invalid note octave ${octave}`);
      assert(octave >= -1 && octave <= 9, `Invalid note octave ${octave}`);
    }

    this.pitchClass = pitchClass;
    this.alteration = alteration;
    this.octave = octave;
  }

  private static from(args: [string] | [number] | [Note] | NoteAttributes): NoteAttributes {
    if (args.length === 2) {
      return args;
    }

    if (args[0] instanceof Note) {
      return [args[0].pitchClass, args[0]];
    }

    if (typeof args[0] === 'number') {
      return Note.fromMidi(args[0]);
    }

    return Note.fromString(args[0]);
  }

  private static fromString(value: string): NoteAttributes {
    const match = /^([A-G])(#|##|b|bb)?(-1|[0-9])?$/.exec(value);

    assert(match, `Invalid note: ${value}`);
    assert(match[1]);

    const pitchClass = match[1];
    const alteration = { bb: -2, b: -1, '': 0, '#': 1, '##': 2 }[match[2] ?? ''];
    const octave = match[3] !== undefined ? Number(match[3]) : undefined;

    assert(this.isPitchClass(pitchClass));
    assert(alteration !== undefined);

    return [pitchClass, { alteration, octave }];
  }

  static isPitchClass(value: string): value is PitchClass {
    return 'ABCDEFG'.includes(value);
  }

  private static fromMidi(value: number): NoteAttributes {
    const octave = Math.floor(value / 12) - 1;
    const semitones = value % 12;

    const pitchClass = 'CCDDEFFGGAAB'.at(semitones);
    const alteration = [1, 3, 6, 8, 10].includes(semitones) ? 1 : 0;

    assert(pitchClass && this.isPitchClass(pitchClass));

    return [pitchClass, { alteration, octave }];
  }

  get midi(): number {
    const semitones = 'CCDDEFFGGAAB'.indexOf(this.pitchClass);
    const octave = this.octave ?? 4;

    return (octave + 1) * 12 + semitones + this.alteration;
  }

  toString(withOctave = true): string {
    const alteration = { '-2': 'bb', '-1': 'b', '0': '', '1': '#', '2': '##' }[this.alteration];
    const octave = withOctave ? this.octave ?? '' : '';

    return `${this.pitchClass}${alteration}${octave}`;
  }

  equals(other: Note) {
    if (this.octave === undefined || other.octave === undefined) {
      return this.pitchClass === other.pitchClass && this.alteration === other.alteration;
    }

    return other.midi === this.midi;
  }

  transpose(interval: Interval) {
    const pitchClasses = 'CDEFGAB';

    const self = new Note(this.pitchClass, {
      alteration: this.alteration,
      octave: 0,
    });

    const pitchClassIndex = pitchClasses.indexOf(this.pitchClass) + (interval.number - 1);
    const pitchClass = pitchClasses.at(pitchClassIndex % pitchClasses.length);

    assert(pitchClass && Note.isPitchClass(pitchClass));

    const note = new Note(pitchClass, {
      alteration: 0,
      octave: Math.floor(pitchClassIndex / pitchClasses.length),
    });

    note.alteration = interval.semitones - (note.midi - self.midi);

    if (this.octave === undefined) {
      note.octave = undefined;
    } else {
      note.octave! += this.octave;
    }

    return note;
  }
}
