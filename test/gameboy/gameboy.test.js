import { assert } from 'chai';
import { it } from 'mocha';
import TestRunner from './runner';
import { RenderTiming } from '../../src/gameboy/gpu';
import Gameboy from '../../src/gameboy/gameboy';

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

    it('is called from gpu core', () => {
      const gameboy = new Gameboy();
      assert.equal(gameboy.gpu._renderTiming._line, 0);
      // runs sufficient num of bios instructions so that timing cycle one scan line
      for (let i = 0; i < 59; i += 1) {
        gameboy.core.fetch();
        gameboy.core.decode();
        gameboy.core.execute();
      }
      assert.notEqual(gameboy.gpu._renderTiming._line, 0);
      assert.notEqual(gameboy.gpu._renderTiming.getMode(), RenderTiming.Mode.sprite);
    });
  });
});
