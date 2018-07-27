import { assert } from 'chai';
import { opcodes, RegMap } from '../../src/gameboy/processor';
import getEmptyState from '../helper/state-helper';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */

// Tests opcode map and utilizes the GB CPU manual to verify behaviour.
describe('Processor', () => {
  describe('Opcode map tests', () => {
    it('map to a specific operation and execute it', () => {
      const s = getEmptyState();
      const nopCode = 0x00;

      assert.isDefined(opcodes[nopCode]);
      assert.isObject(opcodes);
      assert.isFunction(opcodes[nopCode]);
      assert.doesNotThrow(() => opcodes[nopCode](s));
    });

    it('should be able to execute 0x78 by putting B Into A', () => {
      const s = getEmptyState();
      s.reg.reg(RegMap.b, 10);
      const op = 0x78;
      opcodes[op](s);

      assert.equal(s.reg.reg(RegMap.a), 10);
    });

    it('contains only defined functions', () => {
      Object.keys(opcodes).forEach((op) => {
        assert.isFunction(opcodes[op]);
      });
    });

    it('all return information about operation\'s time expenditure', () => {
      const s = getEmptyState();
      Object.keys(opcodes).forEach((op) => {
        const res = opcodes[op](s);
        assert.isDefined(res, `${op} does not return anything`);
        assert.containsAllKeys(res, ['m', 't'], `No clock info on op ${op}`);
        assert.isAbove(res.m, 0);
        assert.isAbove(res.t, 0);
      });
    });
  });
});
