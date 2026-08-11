import assert from 'node:assert';
import test, { describe } from 'node:test';

import { Interval } from './interval.ts';
import { Note } from './note.ts';

describe('Note', () => {
  describe('from string', () => {
    test('C', () => {
      assert.deepStrictEqual(new Note('C'), new Note('C', {}));
    });

    test('C#', () => {
      assert.deepStrictEqual(new Note('C#'), new Note('C', { alteration: 1 }));
    });

    test('C##', () => {
      assert.deepStrictEqual(new Note('C##'), new Note('C', { alteration: 2 }));
    });

    test('Cb', () => {
      assert.deepStrictEqual(new Note('Cb'), new Note('C', { alteration: -1 }));
    });

    test('Cbb', () => {
      assert.deepStrictEqual(new Note('Cbb'), new Note('C', { alteration: -2 }));
    });

    test('C4', () => {
      assert.deepStrictEqual(new Note('C4'), new Note('C', { octave: 4 }));
    });

    test('D4', () => {
      assert.deepStrictEqual(new Note('D4'), new Note('D', { octave: 4 }));
    });

    test('C#4', () => {
      assert.deepStrictEqual(new Note('C#4'), new Note('C', { octave: 4, alteration: 1 }));
    });

    test('C##4', () => {
      assert.deepStrictEqual(new Note('C##4'), new Note('C', { octave: 4, alteration: 2 }));
    });

    test('Cb4', () => {
      assert.deepStrictEqual(new Note('Cb4'), new Note('C', { octave: 4, alteration: -1 }));
    });

    test('Cbb4', () => {
      assert.deepStrictEqual(new Note('Cbb4'), new Note('C', { octave: 4, alteration: -2 }));
    });

    test('C-1', () => {
      assert.deepStrictEqual(new Note('C-1'), new Note('C', { octave: -1 }));
    });

    test('C#-1', () => {
      assert.deepStrictEqual(new Note('C#-1'), new Note('C', { octave: -1, alteration: 1 }));
    });

    test('empty string', () => {
      assert.throws(() => new Note(''));
    });

    test('invalid pitch class', () => {
      assert.throws(() => new Note('H4'));
    });

    test('invalid octave', () => {
      assert.throws(() => new Note('C-2'));
    });
  });

  describe('from midi', () => {
    test('60', () => {
      assert.deepStrictEqual(new Note(60), new Note('C', { octave: 4 }));
    });

    test('62', () => {
      assert.deepStrictEqual(new Note(62), new Note('D', { octave: 4 }));
    });

    test('61', () => {
      assert.deepStrictEqual(new Note(61), new Note('C', { octave: 4, alteration: 1 }));
    });

    test('0', () => {
      assert.deepStrictEqual(new Note(0), new Note('C', { octave: -1 }));
    });

    test('all', () => {
      for (let midi = 0; midi <= 127; ++midi) {
        assert.strictEqual(new Note(midi).midi, midi);
      }
    });
  });

  describe('midi', () => {
    test('C-1', () => {
      assert.strictEqual(new Note('C', { octave: -1 }).midi, 0);
    });

    test('C4', () => {
      assert.strictEqual(new Note('C', { octave: 4 }).midi, 60);
    });

    test('A4', () => {
      assert.strictEqual(new Note('A', { octave: 4 }).midi, 69);
    });

    test('A#4', () => {
      assert.strictEqual(new Note('A', { octave: 4, alteration: 1 }).midi, 70);
    });

    test('Bb4', () => {
      assert.strictEqual(new Note('B', { octave: 4, alteration: -1 }).midi, 70);
    });
  });

  describe('toString', () => {
    test('C', () => {
      assert.strictEqual(new Note('C').toString(), 'C');
    });

    test('D', () => {
      assert.strictEqual(new Note('D').toString(), 'D');
    });

    test('C#', () => {
      assert.strictEqual(new Note('C', { alteration: 1 }).toString(), 'C#');
    });

    test('C4', () => {
      assert.strictEqual(new Note('C', { octave: 4 }).toString(), 'C4');
    });

    test('C#4', () => {
      assert.strictEqual(new Note('C', { octave: 4, alteration: 1 }).toString(), 'C#4');
    });

    test('C-1', () => {
      assert.strictEqual(new Note('C', { octave: -1 }).toString(), 'C-1');
    });
  });

  describe('transpose', () => {
    test('C P1', () => {
      assert.deepStrictEqual(new Note('C').transpose(new Interval('P', 1)), new Note('C'));
    });

    test('C M2', () => {
      assert.deepStrictEqual(new Note('C').transpose(new Interval('M', 2)), new Note('D'));
    });

    test('C m2', () => {
      assert.deepStrictEqual(new Note('C').transpose(new Interval('m', 2)), new Note('Db'));
    });

    test('A d5', () => {
      assert.deepStrictEqual(new Note('A').transpose(new Interval('d', 5)), new Note('Eb'));
    });

    test('D M3', () => {
      assert.deepStrictEqual(new Note('D').transpose(new Interval('M', 3)), new Note('F', { alteration: 1 }));
    });

    test('D P5', () => {
      assert.deepStrictEqual(new Note('D').transpose(new Interval('P', 5)), new Note('A'));
    });

    test('B3 m2', () => {
      assert.deepStrictEqual(
        new Note('B', { octave: 3 }).transpose(new Interval('m', 2)),
        new Note('C', { octave: 4 }),
      );
    });

    test('C P8 without octave', () => {
      assert.deepStrictEqual(new Note('C').transpose(new Interval('P', 8)), new Note('C'));
    });

    test('C P8 with octave', () => {
      assert.deepStrictEqual(
        new Note('C', { octave: 4 }).transpose(new Interval('P', 8)),
        new Note('C', { octave: 5 }),
      );
    });

    test('C m9 with octave', () => {
      assert.deepStrictEqual(
        new Note('C', { octave: 4 }).transpose(new Interval('m', 9)),
        new Note('D', { octave: 5, alteration: -1 }),
      );
    });
  });

  describe('transpose down', () => {
    test('C P1', () => {
      assert.deepStrictEqual(new Note('C').transpose(new Interval('P', 1), 'down'), new Note('C'));
    });

    test('C m3', () => {
      assert.deepStrictEqual(new Note('C').transpose(new Interval('m', 3), 'down'), new Note('A'));
    });

    test('C M3', () => {
      assert.deepStrictEqual(new Note('C').transpose(new Interval('M', 3), 'down'), new Note('Ab'));
    });

    test('G m3', () => {
      assert.deepStrictEqual(new Note('G').transpose(new Interval('m', 3), 'down'), new Note('E'));
    });

    test('E A4', () => {
      assert.deepStrictEqual(new Note('E').transpose(new Interval('A', 4), 'down'), new Note('Bb'));
    });

    test('Bb d5', () => {
      assert.deepStrictEqual(new Note('Bb').transpose(new Interval('d', 5), 'down'), new Note('E'));
    });

    test('F# M7', () => {
      assert.deepStrictEqual(new Note('F#').transpose(new Interval('M', 7), 'down'), new Note('G'));
    });

    test('C4 m2', () => {
      assert.deepStrictEqual(new Note('C4').transpose(new Interval('m', 2), 'down'), new Note('B3'));
    });

    test('E4 A4', () => {
      assert.deepStrictEqual(new Note('E4').transpose(new Interval('A', 4), 'down'), new Note('Bb3'));
    });

    test('C4 P8', () => {
      assert.deepStrictEqual(new Note('C4').transpose(new Interval('P', 8), 'down'), new Note('C3'));
    });

    test('C4 m9', () => {
      assert.deepStrictEqual(new Note('C4').transpose(new Interval('m', 9), 'down'), new Note('B2'));
    });

    test('C P8 without octave', () => {
      assert.deepStrictEqual(new Note('C').transpose(new Interval('P', 8), 'down'), new Note('C'));
    });

    test('undoes an ascending transposition', () => {
      const intervals = ['P1', 'm2', 'M3', 'P4', 'A4', 'd5', 'P5', 'm7', 'P8', 'm9'];

      for (const value of intervals) {
        const interval = Interval.parse(value);

        for (const note of ['C4', 'F#4', 'Bb4', 'E4']) {
          const start = new Note(note);

          assert.deepStrictEqual(start.transpose(interval).transpose(interval, 'down'), start, `${note} ${value}`);
          assert.deepStrictEqual(start.transpose(interval, 'down').transpose(interval), start, `${note} ${value}`);
        }
      }
    });

    test('is the descending interval it is named by', () => {
      const intervals = ['m2', 'M3', 'P4', 'A4', 'P5', 'M6', 'm7', 'P8'];

      for (const value of intervals) {
        const interval = Interval.parse(value);
        const below = new Note('C5').transpose(interval, 'down');

        assert.deepStrictEqual(new Interval(below, new Note('C5')), interval, value);
      }
    });

    test('an unknown direction', () => {
      assert.throws(() => new Note('C').transpose(new Interval('M', 3), 'sideways' as never), {
        message: 'Invalid transpose direction sideways',
      });
    });

    test('below the lowest octave', () => {
      assert.throws(() => new Note('C-1').transpose(new Interval('P', 8), 'down'), {
        message: 'Invalid note octave -2',
      });
    });
  });

  describe('isEnharmonic', () => {
    test('same pitch, different spelling', () => {
      assert.ok(new Note('C#').isEnharmonic(new Note('Db')));
      assert.ok(new Note('Db').isEnharmonic(new Note('C#')));
      assert.ok(new Note('E#').isEnharmonic(new Note('F')));
      assert.ok(new Note('Fb').isEnharmonic(new Note('E')));
      assert.ok(new Note('D').isEnharmonic(new Note('Ebb')));
    });

    test('across the octave boundary, without a register', () => {
      assert.ok(new Note('B#').isEnharmonic(new Note('C')));
      assert.ok(new Note('Cb').isEnharmonic(new Note('B')));
    });

    test('across the octave boundary, with one', () => {
      assert.ok(new Note('B#3').isEnharmonic(new Note('C4')));
      assert.ok(!new Note('B#4').isEnharmonic(new Note('C4')));
    });

    test('the same spelling never is', () => {
      assert.ok(!new Note('C#').isEnharmonic(new Note('C#')));
      assert.ok(!new Note('C#4').isEnharmonic(new Note('C#4')));
      assert.ok(!new Note('C#4').isEnharmonic(new Note('C#5')));
    });

    test('a different pitch never is', () => {
      assert.ok(!new Note('C').isEnharmonic(new Note('D')));
      assert.ok(!new Note('C#').isEnharmonic(new Note('D#')));
      assert.ok(!new Note('C4').isEnharmonic(new Note('Db5')));
    });

    test('anything else never is', () => {
      assert.ok(!new Note('C').isEnharmonic(undefined));
      assert.ok(!new Note('C').isEnharmonic('C'));
    });
  });

  describe('immutability', () => {
    test('properties cannot be reassigned', () => {
      const note = new Note('C');

      assert.throws(() => Object.assign(note, { alteration: 99 }), TypeError);
      assert.strictEqual(note.toString(), 'C');
    });
  });

  describe('with', () => {
    test('overrides a single attribute', () => {
      assert.deepStrictEqual(new Note('C4').with({ alteration: 1 }), new Note('C#4'));
      assert.deepStrictEqual(new Note('C4').with({ octave: 5 }), new Note('C5'));
      assert.deepStrictEqual(new Note('C#4').with({ pitchClass: 'D' }), new Note('D#4'));
    });

    test('clears the octave with null', () => {
      assert.deepStrictEqual(new Note('C#4').with({ octave: null }), new Note('C#'));
      assert.deepStrictEqual(new Note('C#').with({ octave: null }), new Note('C#'));
    });

    test('keeps the octave when it is not provided', () => {
      assert.deepStrictEqual(new Note('C4').with({ octave: undefined }), new Note('C4'));
    });

    test('validates the result', () => {
      assert.throws(() => new Note('C4').with({ alteration: 3 }));
    });
  });
});
