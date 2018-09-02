import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { RenderTiming } from '../../src/gameboy/gpu';


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
      assert.equal(timing.getMode(), RenderTiming.Mode.background);
    });
  });
});
