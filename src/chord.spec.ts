import assert from 'node:assert';
import test, { describe } from 'node:test';

import { Chord } from './chord.ts';
import { Interval } from './interval.ts';
import { Note } from './note.ts';

describe('Chord', () => {
  const C = new Note('C');
  const Csharp = new Note('C', { alteration: 1 });
  const C4 = new Note('C', { octave: 4 });
  const D = new Note('D');
  const A = new Note('A');

  const P1 = new Interval('P', 1);
  const M2 = new Interval('M', 2);
  const m3 = new Interval('m', 3);
  const M3 = new Interval('M', 3);
  const P4 = new Interval('P', 4);
  const d5 = new Interval('d', 5);
  const P5 = new Interval('P', 5);
  const A5 = new Interval('A', 5);
  const d7 = new Interval('d', 7);
  const m7 = new Interval('m', 7);
  const M7 = new Interval('M', 7);

  describe('from string', () => {
    test('major', () => {
      assert.deepStrictEqual(new Chord('C'), new Chord(C, [P1, M3, P5]));
      assert.deepStrictEqual(new Chord('C#'), new Chord(Csharp, [P1, M3, P5]));
    });

    test('minor', () => {
      assert.deepStrictEqual(new Chord('Cm'), new Chord(C, [P1, m3, P5]));
    });

    test('diminished', () => {
      assert.deepStrictEqual(new Chord('Cdim'), new Chord(C, [P1, m3, d5]));
      assert.deepStrictEqual(new Chord('C°'), new Chord(C, [P1, m3, d5]));
    });

    test('augmented', () => {
      assert.deepStrictEqual(new Chord('Caug'), new Chord(C, [P1, M3, A5]));
      assert.deepStrictEqual(new Chord('C+'), new Chord(C, [P1, M3, A5]));
    });

    test('suspended 2nd', () => {
      assert.deepStrictEqual(new Chord('Csus2'), new Chord(C, [P1, M2, P5]));
    });

    test('suspended 4th', () => {
      assert.deepStrictEqual(new Chord('Csus4'), new Chord(C, [P1, P4, P5]));
      assert.deepStrictEqual(new Chord('Csus'), new Chord(C, [P1, P4, P5]));
    });

    test('Dominant 7', () => {
      assert.deepStrictEqual(new Chord('C7'), new Chord(C, [P1, M3, P5, m7]));
    });

    test('Major 7', () => {
      assert.deepStrictEqual(new Chord('Cmaj7'), new Chord(C, [P1, M3, P5, M7]));
    });

    test('Minor 7', () => {
      assert.deepStrictEqual(new Chord('Cm7'), new Chord(C, [P1, m3, P5, m7]));
    });

    test('Minor major 7', () => {
      assert.deepStrictEqual(new Chord('Cm(maj7)'), new Chord(C, [P1, m3, P5, M7]));
    });

    test('Half-diminished', () => {
      assert.deepStrictEqual(new Chord('Cm7b5'), new Chord(C, [P1, m3, d5, m7]));
      assert.deepStrictEqual(new Chord('Cø'), new Chord(C, [P1, m3, d5, m7]));
    });

    test('Diminished 7', () => {
      assert.deepStrictEqual(new Chord('Cdim7'), new Chord(C, [P1, m3, d5, d7]));
      assert.deepStrictEqual(new Chord('C°7'), new Chord(C, [P1, m3, d5, d7]));
    });

    test('Augmented 7', () => {
      assert.deepStrictEqual(new Chord('Caug7'), new Chord(C, [P1, M3, A5, m7]));
      assert.deepStrictEqual(new Chord('C+7'), new Chord(C, [P1, M3, A5, m7]));
    });

    test('Augmented major 7', () => {
      assert.deepStrictEqual(new Chord('Cmaj7(#5)'), new Chord(C, [P1, M3, A5, M7]));
    });

    test('Dominant diminished 7', () => {
      assert.deepStrictEqual(new Chord('C7(b5)'), new Chord(C, [P1, M3, d5, m7]));
    });

    test('Dominant major 7', () => {
      assert.deepStrictEqual(new Chord('Cmaj7(b5)'), new Chord(C, [P1, M3, d5, M7]));
    });

    test('with octave', () => {
      assert.deepStrictEqual(new Chord('C', { octave: 4 }), new Chord(C4, [P1, M3, P5]));
      assert.deepStrictEqual(new Chord('Cm', { octave: 4 }), new Chord(C4, [P1, m3, P5]));
    });

    describe('inversions', () => {
      test('no inversion', () => {
        assert.deepStrictEqual(new Chord('C/C'), new Chord(C, [P1, M3, P5]));
      });

      test('first inversion', () => {
        assert.deepStrictEqual(new Chord('C/E'), new Chord(C, [M3, P5, P1]));
        assert.deepStrictEqual(new Chord('D/F#'), new Chord(D, [M3, P5, P1]));
      });

      test('second inversion', () => {
        assert.deepStrictEqual(new Chord('C/G'), new Chord(C, [P5, P1, M3]));
      });

      test('with octave', () => {
        assert.deepStrictEqual(new Chord('C/E', { octave: 4 }), new Chord(C4, [M3, P5, P1]));
      });

      test('invalid inversion', () => {
        assert.throws(() => new Chord('C/D'), { message: 'Invalid base note D' });
      });
    });
  });

  describe('toString', () => {
    test('major', () => {
      assert.strictEqual(new Chord(C, [P1, M3, P5]).toString(), 'C');
    });

    test('minor', () => {
      assert.strictEqual(new Chord(C, [P1, m3, P5]).toString(), 'Cm');
    });

    test('diminished', () => {
      assert.strictEqual(new Chord(C, [P1, m3, d5]).toString(), 'Cdim');
    });

    test('augmented', () => {
      assert.strictEqual(new Chord(C, [P1, M3, A5]).toString(), 'Caug');
    });

    test('suspended 2nd', () => {
      assert.strictEqual(new Chord(C, [P1, M2, P5]).toString(), 'Csus2');
    });

    test('suspended 4th', () => {
      assert.strictEqual(new Chord(C, [P1, P4, P5]).toString(), 'Csus4');
    });

    test('Dominant 7', () => {
      assert.strictEqual(new Chord(C, [P1, M3, P5, m7]).toString(), 'C7');
    });

    test('Major 7', () => {
      assert.strictEqual(new Chord(C, [P1, M3, P5, M7]).toString(), 'Cmaj7');
    });

    test('Minor 7', () => {
      assert.strictEqual(new Chord(C, [P1, m3, P5, m7]).toString(), 'Cm7');
    });

    test('Minor major 7', () => {
      assert.strictEqual(new Chord(C, [P1, m3, P5, M7]).toString(), 'Cm(maj7)');
    });

    test('Half-diminished', () => {
      assert.strictEqual(new Chord(C, [P1, m3, d5, m7]).toString(), 'Cm7b5');
    });

    test('Diminished 7', () => {
      assert.strictEqual(new Chord(C, [P1, m3, d5, d7]).toString(), 'Cdim7');
    });

    test('Augmented 7', () => {
      assert.strictEqual(new Chord(C, [P1, M3, A5, m7]).toString(), 'Caug7');
    });

    test('Unknown', () => {
      assert.strictEqual(new Chord(C, [P1, M2, M3]).toString(), 'C(?)');
    });

    describe('inversions', () => {
      test('first inversion', () => {
        assert.strictEqual(new Chord(C, [M3, P5, P1]).toString(), 'C/E');
      });

      test('second inversion', () => {
        assert.strictEqual(new Chord(C, [P5, P1, M3]).toString(), 'C/G');
      });
    });
  });

  describe('inversion', () => {
    test('no inversion', () => {
      assert.strictEqual(new Chord(C, [P1, M3, P5]).inversion, 0);
    });

    test('first inversion', () => {
      assert.strictEqual(new Chord(C, [M3, P5, P1]).inversion, 1);
    });

    test('second inversion', () => {
      assert.strictEqual(new Chord(C, [P5, P1, M3]).inversion, 2);
    });
  });

  describe('invert', () => {
    test('no inversion', () => {
      assert.deepStrictEqual(new Chord(C, [P1, M3, P5]).invert(0), new Chord(C, [P1, M3, P5]));
    });

    test('first inversion', () => {
      assert.deepStrictEqual(new Chord(C, [P1, M3, P5]).invert(), new Chord(C, [M3, P5, P1]));
      assert.deepStrictEqual(new Chord(C, [P1, M3, P5]).invert(1), new Chord(C, [M3, P5, P1]));
    });

    test('second inversion', () => {
      assert.deepStrictEqual(new Chord(C, [P1, M3, P5]).invert(2), new Chord(C, [P5, P1, M3]));
    });

    test('third inversion', () => {
      assert.deepStrictEqual(new Chord(C, [P1, M3, P5]).invert(3), new Chord(C, [P1, M3, P5]));
    });
  });

  describe('toRootPosition', () => {
    test('no inversion', () => {
      assert.deepStrictEqual(new Chord(C, [P1, M3, P5]).toRootPosition(), new Chord(C, [P1, M3, P5]));
    });

    test('first inversion', () => {
      assert.deepStrictEqual(new Chord(C, [M3, P5, P1]).toRootPosition(), new Chord(C, [P1, M3, P5]));
    });

    test('second inversion', () => {
      assert.deepStrictEqual(new Chord(C, [P5, P1, M3]).toRootPosition(), new Chord(C, [P1, M3, P5]));
    });
  });

  describe('notes', () => {
    test('C', () => {
      assert.deepStrictEqual(new Chord(C, [P1, M3, P5]).notes, [new Note('C'), new Note('E'), new Note('G')]);
    });

    test('Cm', () => {
      assert.deepStrictEqual(new Chord(C, [P1, m3, P5]).notes, [new Note('C'), new Note('Eb'), new Note('G')]);
    });

    test('D', () => {
      assert.deepStrictEqual(new Chord(D, [P1, M3, P5]).notes, [new Note('D'), new Note('F#'), new Note('A')]);
    });

    test('Adim', () => {
      assert.deepStrictEqual(new Chord(A, [P1, m3, d5]).notes, [new Note('A'), new Note('C'), new Note('Eb')]);
    });

    test('C/E', () => {
      assert.deepStrictEqual(new Chord(C, [M3, P5, P1]).notes, [new Note('E'), new Note('G'), new Note('C')]);
    });

    test('C/E with octave', () => {
      assert.deepStrictEqual(new Chord(C4, [M3, P5, P1]).notes, [
        new Note('E', { octave: 3 }),
        new Note('G', { octave: 3 }),
        new Note('C', { octave: 4 }),
      ]);
    });
  });
});
