import { assert } from 'chai';
import { it, describe } from 'mocha';
import TestRunner from './runner.js';
import { RenderTiming } from '../../src/gameboy/gpu/index.js';
import Gameboy from '../../src/gameboy/gameboy.js';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
/* eslint no-param-reassign: 0 */

// End to end test of cpu and memory.
// Runs bootstrap binary and checks that emulator has all the instructions needed.
describe('Gameboy', () => {
  const runFor = (gameboy, steps) => {
    for (let i = 0; i < steps; i += 1) {
      gameboy.core.oldCycleCount = gameboy.core.clockCycles;
      gameboy.core.fetch();
      gameboy.core.decode();
      gameboy.core.execute();
      gameboy.core.handleClock();
      gameboy.core.handleInterrupts();
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
      gameboy.memory.cartridge.rom[0] = 0x3E; // load immediate into A
      gameboy.memory.cartridge.rom[1] = val;
      gameboy.memory.cartridge.rom[2] = 0x21; // Load  immediate word in HL
      gameboy.memory.cartridge.rom[4] = 0x80; // little endian, uppder half of address
      gameboy.memory.cartridge.rom[5] = 0x77; // put content of A into mem HL

      runFor(gameboy, 6);
      assert.equal(gameboy.core.currentOp, 0x00);
      const res = gameboy.memory.readByte(addr);
      assert.equal(res, val);
      const tile = gameboy.gpu._frameBuffer.getTile(1, 0);
      assert.deepEqual(tile[0], [1, 1, 0, 0, 1, 0, 1, 0]);
    });

    it('should be able to run an entire loop', () => {
      const gameboy = new Gameboy();
      gameboy.core.loop();
      gameboy.core.interrupts.enabled = true;
      assert.equal(gameboy.core.clockCycles, 0);
      gameboy.core.loop();
      assert.equal(gameboy.core.clockCycles, 0);
    });

    it('should run and be able to pause', () => {
      const gameboy = new Gameboy();
      gameboy.start();
      assert.isNotNull(gameboy.interval);
      gameboy.pause();
      assert.isNull(gameboy.interval);
    });

    it('should be able to run a frame', () => {
      const gameboy = new Gameboy();
      gameboy.runForAWhile();
      assert.equal(gameboy.core.clockCycles, 0);
    });
  });
});
