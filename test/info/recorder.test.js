import { assert } from 'chai';
import { it, beforeEach,describe } from 'mocha';
import Recorder from '../../src/info/recorder.js';
import getEmptyState from '../helper/state-helper.js';

/* eslint no-console: 0 */

describe('Misc', () => {
  let recorder = null;
  beforeEach(() => {
    recorder = new Recorder();
    recorder.record(0xCB10, 0x10);
    recorder.record(0x80, 0x11);
    recorder.record(0x32, 0x12);
  });

  describe('Debugger/recorder tests', () => {
    it('records instructions', () => {
      assert.lengthOf(recorder.history, 100);
      assert.equal(recorder.pos, 3);
    });

    it('gets history', () => {
      const hist = recorder.getHistory();
      assert.notEqual(hist[0], '----');
      assert.include(hist[0], 'LD');
      assert.include(hist[0], 12);
      assert.include(hist[1], 'ADD');
      assert.include(hist[1], 11);
      assert.include(hist[2], 10);
      assert.include(hist[2], 'RL');
    });

    it('can get info about current instruction', () => {
      const info = recorder.getCurrent(0xCB10, 0x10);
      assert.include(info, 10);
      assert.include(info, 'RL');
    });

    it('can format register state and clock if supplied', () => {
      const state = getEmptyState();
      const info = recorder.getCurrent(0x12, 0x1200, 203, state);
      assert.include(info, 'A:');
      assert.include(info, 'H:');
    });

    it('can retrive previous run instructions', () => {
      const last = recorder.getPreviousRecord(0);
      const previous = recorder.getPreviousRecord(1);

      assert.equal(last.pc, 0x12);
      assert.equal(previous.pc, 0x11);
    });
  });
});
