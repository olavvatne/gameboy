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
  const runFor = (gameboy, steps) => {
    for (let i = 0; i < steps; i += 1) {
      gameboy.core.fetch();
      gameboy.core.decode();
      gameboy.core.execute();
    }
  };

  describe('End to end of cpu and memory', () => {
    it('runs bootstrap without issue', () => {
      const gameboy = new TestRunner();
      assert.doesNotThrow(() => gameboy.testBootstrap());
      assert.isFalse(gameboy.memory._inBios);
    });

    it('is called from gpu core', () => {
      const gameboy = new Gameboy();
      assert.equal(gameboy.gpu.renderTiming._line, 0);
      // runs sufficient num of bios instructions so that timing cycle one scan line
      runFor(gameboy, 59);
      assert.notEqual(gameboy.gpu.renderTiming.getLine(), 0);
      assert.notEqual(gameboy.gpu.renderTiming.getMode(), RenderTiming.Mode.sprite);
    });

    it('should be able through an instruction write to vram and update buffer cache', () => {
      const gameboy = new Gameboy();
      gameboy.memory.exitBios();
      // Load hl with data
      // write hl to buffer
      const val = 0b11001010;
      const addr = 0x8000; // Tile 0 row 0 byte 0
      gameboy.memory.writeByte(0x00, 0x3E); // load immediate into A
      gameboy.memory.writeByte(0x01, val);
      gameboy.memory.writeByte(0x02, 0x21); // Load  immediate word in HL
      gameboy.memory.writeWord(0x03, addr);
      gameboy.memory.writeByte(0x05, 0x77); // put content of A into mem HL

      runFor(gameboy, 6);
      assert.equal(gameboy.core.currentOp, 0x00);
      const res = gameboy.memory.readByte(addr);
      assert.equal(res, val);
      const tile = gameboy.gpu._frameBuffer.getTile(1, 0);
      assert.deepEqual(tile[0], [1, 1, 0, 0, 1, 0, 1, 0]);
    });

    it('should be able to run an entire loop', () => {
      const gameboy = new Gameboy();
      const frame = 70224;
      gameboy.core.loop();
      assert.isAtLeast(gameboy.core.clock.clockCycles, frame);
      gameboy.core.loop();
      assert.isAtLeast(gameboy.core.clock.clockCycles, frame * 2);
    });
  });
});
