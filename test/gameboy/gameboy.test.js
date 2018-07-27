import { assert } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { Gameboy } from '../../src/gameboy';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */

// End to end test of cpu and memory.
// Runs bootstrap binary and checks that emulator has all the instructions needed.
describe('Gameboy', () => {
  describe('End to end of cpu and memory', () => {
    it('runs binary bootstrap without issue', () => {
      // TODO: Modify test to use bootstrap loading when implemented
      const gameboy = new Gameboy();
      const binary = fs.readFileSync(path.resolve(__dirname, '../helper/bootstrap.bin'));
      const start = 0x0100;
      binary.map((val, idx) => gameboy.memory.writeByte(start + idx, val));
      setTimeout(() => gameboy.stop(), 500);

      assert.doesNotThrow(() => gameboy.start());
    });
  });
});
