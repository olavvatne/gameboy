import { assert } from 'chai';
import { it, beforeEach,describe } from 'mocha';
import { RenderTiming } from '../../src/gameboy/gpu/index.js';

describe('GPU', () => {
  const numFrameTicks = 70224;
  let timing = null;
  beforeEach(() => {
    timing = new RenderTiming();
  });

  describe('render timing state tests', () => {
    it('visits every state', () => {
      const visited = {};
      for (let i = 0; i < numFrameTicks + 1; i += 8) {
        timing.step(i);
        visited[timing._mode] = true;
      }

      assert.isTrue(visited[RenderTiming.Mode.hblank]);
      assert.isTrue(visited[RenderTiming.Mode.vblank]);
      assert.isTrue(visited[RenderTiming.Mode.sprite]);
      assert.isTrue(visited[RenderTiming.Mode.background]);
    });

    it('starts in sprite state (line 1)', () => {
      timing.step(10);
      assert.equal(timing.getMode(), RenderTiming.Mode.sprite);
      assert.equal(timing._line, 0);
    });

    it('then proceed to background line after tick 80', () => {
      timing.step(10);
      timing.step(70);
      assert.equal(timing.getMode(), RenderTiming.Mode.background);
    });

    it('goes into hblank state after line state', () => {
      timing.step(80);
      timing.step(172);
      assert.equal(timing.getMode(), RenderTiming.Mode.hblank);
    });

    it('stays in hblank for a duration before starting on a new line', () => {
      timing.step(80);
      timing.step(172);
      timing.step(204);
      assert.equal(timing.getMode(), RenderTiming.Mode.sprite);
      assert.equal(timing._line, 1);
    });

    it('enters vblank after 144 lines have been scanned', () => {
      for (let i = 0; i < 144; i += 1) {
        timing.step(80);
        timing.step(172);
        timing.step(204);
      }
      assert.equal(timing.getMode(), RenderTiming.Mode.vblank);
      assert.equal(timing._line, 144);
    });

    it('goes back to line 1 after finishing vblank', () => {
      for (let i = 0; i < 144; i += 1) {
        timing.step(80);
        timing.step(172);
        timing.step(204);
      }
      for (let i = 0; i < 9; i += 1) {
        timing.step(456);
        assert.equal(timing.getMode(), RenderTiming.Mode.vblank);
      }
      assert.equal(timing._line, 153);
      timing.step(456);

      assert.equal(timing.getMode(), RenderTiming.Mode.sprite);
      assert.equal(timing._line, 0);
    });

    it('retrieves correct lcd status byte', () => {
      const lycStat = 0b11000111;
      timing._mode = 3;
      timing.EnableOrDisableStatInterrupts(0b01000000);
      assert.equal(timing.getStat(), lycStat);

      timing._mode = 2;
      const oamStat = 0b10100110;
      timing.EnableOrDisableStatInterrupts(0b10100000);
      assert.equal(timing.getStat(), oamStat);

      timing._mode = 1;
      timing._line = 1;
      const vblankEnableNoLyEqualsLycStat = 0b10010001;
      timing.EnableOrDisableStatInterrupts(0b00010000);
      assert.equal(timing.getStat(), vblankEnableNoLyEqualsLycStat);

      const allEnabled = 0b11111001;
      timing.EnableOrDisableStatInterrupts(0b11111001);
      assert.equal(timing.getStat(), allEnabled);
    });
  });
});
