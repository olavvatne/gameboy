import { assert } from 'chai';
import TestRunner from './runner';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */

// End to end test of cpu and memory.
// Runs bootstrap binary and checks that emulator has all the instructions needed.
describe('Gameboy', () => {
  describe('End to end of cpu and memory', () => {
    it('runs bootstrap without issue', () => {
      const gameboy = new TestRunner();
      assert.doesNotThrow(() => gameboy.testBootstrap());
      assert.isFalse(gameboy.memory._inBios);
    });
  });
});
