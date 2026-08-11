import assert from 'node:assert';
import test, { describe } from 'node:test';

import { Interval, type IntervalQuality } from './interval.ts';
import { Note } from './note.ts';

function array<T>(count: number, create: (index: number) => T) {
  return Array(count)
    .fill(null)
    .map((_, index) => create(index));
}

describe('Interval', () => {
  describe('validation', () => {
    test('invalid number < 0', () => {
      assert.throws(() => new Interval('P', -1), { message: 'Invalid interval number: -1' });
    });

    test('invalid number = 0', () => {
      assert.throws(() => new Interval('P', 0), { message: 'Invalid interval number: 0' });
    });

    test('invalid semitones', () => {
      assert.throws(() => new Interval(-3), { message: 'Invalid interval semitones: -3' });
      assert.throws(() => new Interval(1.5), { message: 'Invalid interval semitones: 1.5' });
    });

    describe('perfect quality', () => {
      const valid = [1, 4, 5, 8, 11, 12, 15];

      for (const number of array(16, (i) => i + 1)) {
        const isValid = valid.includes(number);

        test(`${isValid ? 'valid' : 'invalid'} P${number}`, () => {
          if (isValid) {
            assert.doesNotThrow(() => new Interval('P', number));
          } else {
            assert.throws(() => new Interval('P', number), { message: 'Invalid interval quality: P' });
          }
        });
      }
    });

    describe('minor / major quality', () => {
      const valid = [2, 3, 6, 7, 9, 10, 13, 14, 16];

      for (const quality of ['M', 'm'] as const) {
        for (const number of array(16, (i) => i + 1)) {
          const isValid = valid.includes(number);

          test(`${isValid ? 'valid' : 'invalid'} ${quality}${number}`, () => {
            if (isValid) {
              assert.doesNotThrow(() => new Interval(quality, number));
            } else {
              assert.throws(() => new Interval(quality, number), { message: `Invalid interval quality: ${quality}` });
            }
          });
        }
      }
    });
  });

  describe('from notes', () => {
    const C = new Note('C');
    const flat = { alteration: -1 };
    const sharp = { alteration: 1 };

    // prettier-ignore
    const tests = new Map<Note, Interval>([
      [new Note('C'),         new Interval('P', 1)],
      [new Note('C', sharp),  new Interval('A', 1)],
      [new Note('D', flat),   new Interval('m', 2)],
      [new Note('D'),         new Interval('M', 2)],
      [new Note('D', sharp),  new Interval('A', 2)],
      [new Note('E', flat),   new Interval('m', 3)],
      [new Note('E'),         new Interval('M', 3)],
      [new Note('E', sharp),  new Interval('A', 3)],
      [new Note('F', flat),   new Interval('d', 4)],
      [new Note('F'),         new Interval('P', 4)],
      [new Note('F', sharp),  new Interval('A', 4)],
      [new Note('G', flat),   new Interval('d', 5)],
      [new Note('G'),         new Interval('P', 5)],
      [new Note('G', sharp),  new Interval('A', 5)],
      [new Note('A', flat),   new Interval('m', 6)],
      [new Note('A'),         new Interval('M', 6)],
      [new Note('A', sharp),  new Interval('A', 6)],
      [new Note('B', flat),   new Interval('m', 7)],
      [new Note('B'),         new Interval('M', 7)],
      [new Note('B', sharp),  new Interval('A', 7)],
    ]);

    for (const [note, interval] of tests.entries()) {
      test(`${C} to ${note} = ${interval}`, () => {
        assert.deepStrictEqual(new Interval(C, note), interval);
      });
    }

    test('across an octave', () => {
      assert.deepStrictEqual(
        new Interval(new Note('A', { octave: 4 }), new Note('D', { octave: 5 })),
        new Interval('P', 4),
      );
    });

    test('compound', () => {
      assert.deepStrictEqual(
        new Interval(new Note('C', { octave: 4 }), new Note('C', { octave: 5 })),
        new Interval('P', 8),
      );

      assert.deepStrictEqual(
        new Interval(new Note('C', { octave: 4 }), new Note('C', { alteration: 1, octave: 5 })),
        new Interval('A', 8),
      );

      assert.deepStrictEqual(
        new Interval(new Note('C', { octave: 4 }), new Note('D', { alteration: -1, octave: 5 })),
        new Interval('m', 9),
      );

      assert.deepStrictEqual(
        new Interval(new Note('C', { octave: 4 }), new Note('D', { octave: 5 })),
        new Interval('M', 9),
      );
    });

    describe('doubly altered', () => {
      // prettier-ignore
      const tests = new Map<[string, string], Interval>([
        [['Cb', 'C#'], new Interval('AA', 1)],
        [['Cb', 'D#'], new Interval('AA', 2)],
        [['C#', 'Db'], new Interval('d', 2)],
        [['D#', 'F'],  new Interval('d', 3)],
        [['C#', 'Fb'], new Interval('dd', 4)],
        [['C#', 'Gb'], new Interval('dd', 5)],
        [['Cb', 'G#'], new Interval('AA', 5)],
      ]);

      for (const [[from, to], interval] of tests.entries()) {
        test(`${from} to ${to} = ${interval}`, () => {
          assert.deepStrictEqual(new Interval(new Note(from), new Note(to)), interval);
        });
      }
    });

    describe('descending', () => {
      test('lower letter', () => {
        assert.throws(() => new Interval(new Note('B'), new Note('C')), {
          message: 'Cannot compute a descending interval, from B to C',
        });
      });

      test('same letter, lower pitch', () => {
        assert.throws(() => new Interval(new Note('C'), new Note('Cb')), {
          message: 'Cannot compute a descending interval, from C to Cb',
        });
      });

      test('same pitch, lower letter', () => {
        assert.throws(() => new Interval(new Note('F'), new Note('E', { alteration: 1 })), {
          message: 'Cannot compute a descending interval, from F to E#',
        });
      });
    });

    test('beyond doubly augmented', () => {
      assert.throws(() => new Interval(new Note('Fb'), new Note('B#')), {
        message: 'Interval from Fb to B# is beyond doubly diminished or augmented',
      });
    });

    test('every ascending pair round trips through transpose', () => {
      const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].flatMap((pitchClass) =>
        ['b', '', '#'].map((alteration) => new Note(`${pitchClass}${alteration}`)),
      );

      for (const a of notes) {
        for (const b of notes) {
          let interval: Interval;

          try {
            interval = new Interval(a, b);
          } catch (error) {
            // failing is allowed, failing without saying why is not
            assert.match(
              (error as Error).message,
              /^(Cannot compute a descending interval|Interval from .* is beyond)/,
              `${a} to ${b}`,
            );
            continue;
          }

          assert.ok(a.transpose(interval).equals(b), `${a} to ${b} gave ${interval}`);
        }
      }
    });
  });

  describe('from semitones', () => {
    // prettier-ignore
    const tests = new Map<number, Interval>([
      [0,  new Interval('P', 1)],
      [11, new Interval('M', 7)],
      [12, new Interval('P', 8)],
      [13, new Interval('m', 9)],
      [19, new Interval('P', 12)],
      [24, new Interval('P', 15)],
    ]);

    for (const [semitones, interval] of tests.entries()) {
      test(`${semitones} = ${interval}`, () => {
        assert.deepStrictEqual(new Interval(semitones), interval);
      });
    }

    test('round trips for 0 to 24 semitones', () => {
      for (let semitones = 0; semitones <= 24; ++semitones) {
        assert.strictEqual(new Interval(semitones).semitones, semitones, `${semitones} semitones`);
      }
    });
  });

  describe('from string', () => {
    const tests: Array<[IntervalQuality, number]> = [
      ['P', 1],
      ['m', 2],
      ['M', 2],
      ['m', 3],
      ['M', 3],
      ['P', 4],
      ['P', 5],
      ['m', 6],
      ['M', 6],
      ['m', 7],
      ['M', 7],
      ['P', 8],
    ];

    for (const [quality, number] of tests) {
      test(`${quality}${number}`, () => {
        assert.deepStrictEqual(new Interval(`${quality}${number}`), new Interval(quality, number));
      });
    }

    test('diminished', () => {
      assert.deepStrictEqual(new Interval('d2'), new Interval('d', 2));
    });

    test('double diminished', () => {
      assert.deepStrictEqual(new Interval('dd2'), new Interval('dd', 2));
    });

    test('augmented', () => {
      assert.deepStrictEqual(new Interval('A2'), new Interval('A', 2));
    });

    test('double augmented', () => {
      assert.deepStrictEqual(new Interval('AA2'), new Interval('AA', 2));
    });
  });

  describe('parse', () => {
    test('takes a plain string', () => {
      const value: string = 'm3';

      assert.deepStrictEqual(Interval.parse(value), new Interval('m', 3));
    });

    test('compound', () => {
      assert.deepStrictEqual(Interval.parse('M13'), new Interval('M', 13));
    });

    test('round-trips toString', () => {
      for (const quality of ['P', 'm', 'M', 'd', 'dd', 'A', 'AA'] as IntervalQuality[]) {
        for (const number of [1, 2, 4, 7, 8, 11]) {
          const perfect = quality === 'P';
          const imperfect = quality === 'M' || quality === 'm';

          if ((perfect || imperfect) && Interval.isPerfect(number) !== perfect) {
            continue;
          }

          const interval = new Interval(quality, number);

          assert.deepStrictEqual(Interval.parse(interval.toString()), interval);
        }
      }
    });

    test('rejects what the constructor rejects', () => {
      assert.throws(() => Interval.parse('third'), { message: 'Invalid interval: third' });
      assert.throws(() => Interval.parse('X3'), { message: 'Invalid interval: X3' });
      assert.throws(() => Interval.parse(''), { message: 'Invalid interval: ' });
      assert.throws(() => Interval.parse('M4'), { message: 'Invalid interval quality: M' });
    });
  });

  describe('toString', () => {
    const tests: Array<[IntervalQuality, number]> = [
      ['P', 1],
      ['m', 2],
      ['M', 2],
      ['m', 3],
      ['M', 3],
      ['P', 4],
      ['P', 5],
      ['m', 6],
      ['M', 6],
      ['m', 7],
      ['M', 7],
      ['P', 8],
    ];

    for (const [quality, number] of tests) {
      test(`${quality}${number}`, () => {
        assert.equal(new Interval(quality, number).toString(), `${quality}${number}`);
      });
    }

    test('diminished', () => {
      assert.deepStrictEqual(new Interval('d2'), new Interval('d', 2));
    });

    test('double diminished', () => {
      assert.deepStrictEqual(new Interval('dd2'), new Interval('dd', 2));
    });

    test('augmented', () => {
      assert.deepStrictEqual(new Interval('A2'), new Interval('A', 2));
    });

    test('double augmented', () => {
      assert.deepStrictEqual(new Interval('AA2'), new Interval('AA', 2));
    });
  });

  describe('semitones', () => {
    describe('simple', () => {
      const tests = new Map<Interval, number>([
        [new Interval('P', 1), 0],
        [new Interval('A', 1), 1],
        [new Interval('d', 2), 0],
        [new Interval('m', 2), 1],
        [new Interval('M', 2), 2],
        [new Interval('A', 2), 3],
        [new Interval('d', 3), 2],
        [new Interval('m', 3), 3],
        [new Interval('M', 3), 4],
        [new Interval('A', 3), 5],
        [new Interval('d', 4), 4],
        [new Interval('P', 4), 5],
        [new Interval('A', 4), 6],
        [new Interval('d', 5), 6],
        [new Interval('P', 5), 7],
        [new Interval('A', 5), 8],
        [new Interval('d', 6), 7],
        [new Interval('m', 6), 8],
        [new Interval('M', 6), 9],
        [new Interval('A', 6), 10],
        [new Interval('d', 7), 9],
        [new Interval('m', 7), 10],
        [new Interval('M', 7), 11],
        [new Interval('A', 7), 12],
        [new Interval('d', 8), 11],
        [new Interval('P', 8), 12],
      ]);

      for (const [interval, semitones] of tests.entries()) {
        test(`${interval} = ${semitones}`, () => {
          assert.equal(interval.semitones, semitones);
        });
      }
    });

    describe('compound', () => {
      const tests = new Map<Interval, number>([
        [new Interval('m', 9), 13],
        [new Interval('M', 9), 14],
        [new Interval('m', 10), 15],
        [new Interval('d', 10), 14],
        [new Interval('d', 13), 19],
        [new Interval('dd', 10), 13],
        [new Interval('P', 15), 24],
        [new Interval('m', 16), 25],
        [new Interval('d', 17), 26],
      ]);

      for (const [interval, semitones] of tests.entries()) {
        test(`${interval} = ${semitones}`, () => {
          assert.equal(interval.semitones, semitones);
        });
      }
    });

    test('double diminished', () => {
      assert.strictEqual(new Interval('dd5').semitones, 5);
    });

    test('double augmented', () => {
      assert.strictEqual(new Interval('AA2').semitones, 4);
    });
  });

  describe('simple', () => {
    test('simple', () => {
      assert.deepEqual(new Interval('P', 1).simple(), new Interval('P', 1));
      assert.deepEqual(new Interval('m', 2).simple(), new Interval('m', 2));
      assert.deepEqual(new Interval('P', 8).simple(), new Interval('P', 8));
    });

    test('compound', () => {
      assert.deepEqual(new Interval('m', 9).simple(), new Interval('m', 2));
      assert.deepEqual(new Interval('M', 9).simple(), new Interval('M', 2));
      assert.deepEqual(new Interval('P', 11).simple(), new Interval('P', 4));
      assert.deepEqual(new Interval('m', 16).simple(), new Interval('m', 2));
    });

    test('whole octaves', () => {
      assert.deepEqual(new Interval('P', 15).simple(), new Interval('P', 8));
      assert.deepEqual(new Interval('P', 22).simple(), new Interval('P', 8));
      assert.deepEqual(new Interval('P', 15).invert(), new Interval('P', 1));
    });
  });

  describe('invert', () => {
    test('perfect', () => {
      assert.deepEqual(new Interval('P', 1).invert(), new Interval('P', 8));
      assert.deepEqual(new Interval('P', 4).invert(), new Interval('P', 5));
      assert.deepEqual(new Interval('P', 5).invert(), new Interval('P', 4));
      assert.deepEqual(new Interval('P', 8).invert(), new Interval('P', 1));
    });

    test('major', () => {
      assert.deepEqual(new Interval('M', 2).invert(), new Interval('m', 7));
      assert.deepEqual(new Interval('M', 3).invert(), new Interval('m', 6));
      assert.deepEqual(new Interval('M', 6).invert(), new Interval('m', 3));
      assert.deepEqual(new Interval('M', 7).invert(), new Interval('m', 2));
    });

    test('minor', () => {
      assert.deepEqual(new Interval('m', 2).invert(), new Interval('M', 7));
      assert.deepEqual(new Interval('m', 3).invert(), new Interval('M', 6));
      assert.deepEqual(new Interval('m', 6).invert(), new Interval('M', 3));
      assert.deepEqual(new Interval('m', 7).invert(), new Interval('M', 2));
    });

    test('augmented', () => {
      assert.deepEqual(new Interval('A', 4).invert(), new Interval('d', 5));
      assert.deepEqual(new Interval('AA', 4).invert(), new Interval('dd', 5));
    });

    test('diminished', () => {
      assert.deepEqual(new Interval('d', 5).invert(), new Interval('A', 4));
      assert.deepEqual(new Interval('dd', 5).invert(), new Interval('AA', 4));
    });

    test('compound interval', () => {
      assert.deepEqual(new Interval('P', 1).invert(), new Interval('P', 8));
      assert.deepEqual(new Interval('M', 9).invert(), new Interval('m', 7));
      assert.deepEqual(new Interval('m', 10).invert(), new Interval('M', 6));
    });
  });
});
