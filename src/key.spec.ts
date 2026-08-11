import assert from 'node:assert';
import test, { describe } from 'node:test';

import { Key, type KeyMode } from './key.ts';
import { Note } from './note.ts';

const majors = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
const minors = ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'];

function key(value: string) {
  return new Key(value);
}

describe('Key', () => {
  describe('construction', () => {
    test('from a string', () => {
      assert.deepStrictEqual(new Key('Ab major'), new Key(new Note('Ab'), 'major'));
    });

    test('from a tonic string and a mode', () => {
      assert.deepStrictEqual(new Key('F#', 'minor'), new Key(new Note('F#'), 'minor'));
    });

    test('from another key', () => {
      assert.deepStrictEqual(new Key(key('D major')), key('D major'));
    });

    test('every major key', () => {
      for (const tonic of majors) {
        assert.strictEqual(new Key(tonic, 'major').toString(), `${tonic} major`);
      }
    });

    test('every minor key', () => {
      for (const tonic of minors) {
        assert.strictEqual(new Key(tonic, 'minor').toString(), `${tonic} minor`);
      }
    });
  });

  describe('validation', () => {
    test('a tonic outside the 15 keys of its mode', () => {
      assert.throws(() => new Key('G#', 'major'), { message: 'Invalid major key: G#' });
      assert.throws(() => new Key('Cb', 'minor'), { message: 'Invalid minor key: Cb' });
    });

    test('a tonic with an octave', () => {
      assert.throws(() => new Key(new Note('C4'), 'major'), { message: 'A key has no octave: C4' });
    });

    test('an invalid mode', () => {
      assert.throws(() => new Key('C', 'dorian' as KeyMode), { message: 'Invalid key mode: dorian' });
    });

    test('an invalid string', () => {
      assert.throws(() => new Key('C'), { message: 'Invalid key: C' });
      assert.throws(() => new Key('H major'), { message: 'Invalid key: H major' });
      assert.throws(() => new Key('C Major'), { message: 'Invalid key: C Major' });
    });

    test('no key at that position on the circle', () => {
      assert.throws(() => Key.fromFifths(8, 'major'), { message: 'No major key at 8 fifths' });
      assert.throws(() => Key.fromFifths(-8, 'minor'), { message: 'No minor key at -8 fifths' });
    });

    test('an invalid mode, from fromFifths', () => {
      assert.throws(() => Key.fromFifths(0, 'dorian' as KeyMode), { message: 'Invalid key mode: dorian' });
    });
  });

  describe('immutability', () => {
    test('properties cannot be reassigned', () => {
      const key = new Key('C major');

      assert.throws(() => Object.assign(key, { mode: 'minor' }), TypeError);
      assert.strictEqual(key.toString(), 'C major');
    });

    test('the accidental orders cannot be mutated', () => {
      assert.throws(() => Object.assign(Key.sharpOrder, { 0: 'X' }), TypeError);
      assert.throws(() => Object.assign(Key.flatOrder, { 0: 'X' }), TypeError);
      assert.deepStrictEqual(key('A major').accidentals.map(String), ['F#', 'C#', 'G#']);
    });
  });

  describe('fifths', () => {
    test('the naturals sit at the centre', () => {
      assert.strictEqual(key('C major').fifths, 0);
      assert.strictEqual(key('A minor').fifths, 0);
    });

    test('positive towards the sharps', () => {
      assert.strictEqual(key('G major').fifths, 1);
      assert.strictEqual(key('C# major').fifths, 7);
      assert.strictEqual(key('A# minor').fifths, 7);
    });

    test('negative towards the flats', () => {
      assert.strictEqual(key('F major').fifths, -1);
      assert.strictEqual(key('Cb major').fifths, -7);
      assert.strictEqual(key('Ab minor').fifths, -7);
    });

    test('round-trips through fromFifths', () => {
      for (const mode of ['major', 'minor'] as KeyMode[]) {
        for (let fifths = -7; fifths <= 7; fifths++) {
          assert.strictEqual(Key.fromFifths(fifths, mode).fifths, fifths);
        }
      }
    });
  });

  describe('signature', () => {
    test('no accidental has no direction', () => {
      assert.deepStrictEqual(key('C major').signature, { count: 0 });
      assert.deepStrictEqual(key('A minor').signature, { count: 0 });
    });

    test('sharps', () => {
      assert.deepStrictEqual(key('D major').signature, { count: 2, accidental: 'sharp' });
      assert.deepStrictEqual(key('C# major').signature, { count: 7, accidental: 'sharp' });
      assert.deepStrictEqual(key('B minor').signature, { count: 2, accidental: 'sharp' });
    });

    test('flats', () => {
      assert.deepStrictEqual(key('Bb major').signature, { count: 2, accidental: 'flat' });
      assert.deepStrictEqual(key('Cb major').signature, { count: 7, accidental: 'flat' });
      assert.deepStrictEqual(key('C minor').signature, { count: 3, accidental: 'flat' });
    });

    test('relatives share it', () => {
      for (let fifths = -7; fifths <= 7; fifths++) {
        const major = Key.fromFifths(fifths, 'major');

        assert.deepStrictEqual(major.signature, major.relative.signature);
      }
    });
  });

  describe('accidentals', () => {
    test('none', () => {
      assert.deepStrictEqual(key('C major').accidentals, []);
    });

    test('sharps, in the order they are written', () => {
      assert.deepStrictEqual(key('A major').accidentals, [new Note('F#'), new Note('C#'), new Note('G#')]);
    });

    test('flats, in the order they are written', () => {
      assert.deepStrictEqual(key('Eb major').accidentals, [new Note('Bb'), new Note('Eb'), new Note('Ab')]);
    });

    test('all seven', () => {
      assert.deepStrictEqual(key('C# major').accidentals.map(String), ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#']);

      assert.deepStrictEqual(key('Cb major').accidentals.map(String), ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb']);
    });

    test('the flat order is the sharp order reversed', () => {
      assert.deepStrictEqual(Key.flatOrder.toReversed(), [...Key.sharpOrder]);
    });

    test('the tonic is altered exactly when the signature says so', () => {
      for (let fifths = -7; fifths <= 7; fifths++) {
        const { tonic, accidentals } = Key.fromFifths(fifths, 'major');
        const altered = accidentals.some((note) => note.pitchClass === tonic.pitchClass);

        assert.strictEqual(altered, tonic.alteration !== 0, `${tonic}`);
      }
    });
  });

  describe('relative', () => {
    test('of a major key', () => {
      assert.ok(key('C major').relative.equals(key('A minor')));
      assert.ok(key('Ab major').relative.equals(key('F minor')));
      assert.ok(key('Cb major').relative.equals(key('Ab minor')));
    });

    test('of a minor key', () => {
      assert.ok(key('A minor').relative.equals(key('C major')));
      assert.ok(key('D# minor').relative.equals(key('F# major')));
    });

    test('is its own inverse', () => {
      for (let fifths = -7; fifths <= 7; fifths++) {
        const major = Key.fromFifths(fifths, 'major');

        assert.ok(major.relative.relative.equals(major));
      }
    });
  });

  describe('parallel', () => {
    test('of a major key', () => {
      assert.ok(key('C major').parallel?.equals(key('C minor')));
      assert.ok(key('A major').parallel?.equals(key('A minor')));
    });

    test('of a minor key', () => {
      assert.ok(key('C minor').parallel?.equals(key('C major')));
      assert.ok(key('F# minor').parallel?.equals(key('F# major')));
    });

    test('keeps the tonic', () => {
      for (let fifths = -4; fifths <= 7; fifths++) {
        const major = Key.fromFifths(fifths, 'major');

        assert.ok(major.parallel?.tonic.equals(major.tonic), `${major}`);
      }
    });

    test('does not exist beyond the 30 keys', () => {
      assert.strictEqual(key('Cb major').parallel, undefined);
      assert.strictEqual(key('Gb major').parallel, undefined);
      assert.strictEqual(key('A# minor').parallel, undefined);
      assert.strictEqual(key('D# minor').parallel, undefined);
    });
  });

  describe('enharmonic', () => {
    test('the three pairs of major keys', () => {
      assert.ok(key('B major').enharmonic?.equals(key('Cb major')));
      assert.ok(key('F# major').enharmonic?.equals(key('Gb major')));
      assert.ok(key('C# major').enharmonic?.equals(key('Db major')));
    });

    test('is its own inverse', () => {
      assert.ok(key('Db major').enharmonic?.equals(key('C# major')));
      assert.ok(key('G# minor').enharmonic?.equals(key('Ab minor')));
    });

    test('none below five accidentals', () => {
      assert.strictEqual(key('C major').enharmonic, undefined);
      assert.strictEqual(key('E major').enharmonic, undefined);
      assert.strictEqual(key('D minor').enharmonic, undefined);
    });

    test('the tonics sound the same', () => {
      for (const fifths of [-7, -6, -5, 5, 6, 7]) {
        const major = Key.fromFifths(fifths, 'major');
        const enharmonic = major.enharmonic;

        assert.ok(enharmonic && major.tonic.isEnharmonic(enharmonic.tonic), `${major}`);
      }
    });
  });

  describe('equals', () => {
    test('same tonic and mode', () => {
      assert.ok(key('F# major').equals(key('F# major')));
    });

    test('a different mode', () => {
      assert.ok(!key('C major').equals(key('C minor')));
    });

    test('an enharmonic tonic', () => {
      assert.ok(!key('B major').equals(key('Cb major')));
    });

    test('anything else', () => {
      assert.ok(!key('C major').equals(undefined));
      assert.ok(!key('C major').equals('C major'));
    });
  });
});
