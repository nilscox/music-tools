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
        new Note('C', { octave: 4 })
      );
    });

    test('C P8 without octave', () => {
      assert.deepStrictEqual(new Note('C').transpose(new Interval('P', 8)), new Note('C'));
    });

    test('C P8 with octave', () => {
      assert.deepStrictEqual(
        new Note('C', { octave: 4 }).transpose(new Interval('P', 8)),
        new Note('C', { octave: 5 })
      );
    });

    test('C m9 with octave', () => {
      assert.deepStrictEqual(
        new Note('C', { octave: 4 }).transpose(new Interval('m', 9)),
        new Note('D', { octave: 5, alteration: -1 })
      );
    });
  });
});
