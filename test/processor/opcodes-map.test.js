import { assert } from 'chai';
import { it, beforeEach, describe } from 'mocha';
import { opcodes } from '../../src/gameboy/processor/index.js';
import getEmptyState from '../helper/state-helper.js';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */

// Tests opcode map and utilizes the GB CPU manual to verify behaviour.
describe('Processor', () => {
  let state = null;
  let reg = null;
  beforeEach(() => {
    state = getEmptyState();
    reg = state.map;
  });

  describe('Opcode map tests', () => {
    it('trigger error if core requests opcode modifier instruction', () => {
      // opcode modifier not an instruction
      const modCode = 0xCB;
      assert.throws(() => opcodes[modCode]());
    });

    it('map to a specific operation and execute it', () => {
      const nopCode = 0x00;

      assert.isDefined(opcodes[nopCode]);
      assert.isObject(opcodes);
      assert.isFunction(opcodes[nopCode]);
      assert.doesNotThrow(() => opcodes[nopCode](state));
    });

    it('should be able to execute 0x78 by putting B Into A', () => {
      reg.b(10);
      const op = 0x78;
      opcodes[op](state);

      assert.equal(reg.a(), 10);
    });

    it('contains only defined functions', () => {
      Object.keys(opcodes).forEach((op) => {
        assert.isFunction(opcodes[op]);
      });
    });

    it('all return information about operation\'s time expenditure', () => {
      Object.keys(opcodes).forEach((op) => {
        if (op !== `${0xCB}`) {
          state = getEmptyState();
          state.mmu.exitBios();
          const res = opcodes[op](state);
          assert.isDefined(res, `${op} does not return anything`);
          assert.isAbove(res, 0);
        }
      });
    });
  });
});
