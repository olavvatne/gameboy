import { assert } from 'chai';
import { it, beforeEach, describe } from 'mocha';
import OpcodeInfoManager from '../../src/info/info-manager.js';
import opcodes from '../../src/info/opcodes.js';


describe('Misc', () => {
  let info = null;
  beforeEach(() => {
    info = new OpcodeInfoManager();
  });

  describe('Info manager tests', () => {
    it('has data about opcodes available', () => {
      assert.isDefined(opcodes);
      assert.isDefined(opcodes.unprefixed);
      assert.isDefined(opcodes.cbprefixed);
    });

    it('can get the description of an unprefixed instruction', () => {
      const instr = info.getDescription('0x20');
      const instr2 = info.getDescription('0xAC');
      assert.isDefined(instr);
      assert.isDefined(instr2);
      assert.include(instr, 'JR');
      assert.include(instr2, 'XOR');
    });

    it('can get info about instruction', () => {
      const instr = info.findInfo(0x66);
      assert.equal(instr.mnemonic, 'LD');
      assert.equal(instr.operand2, '(HL)');
    });

    it('also finds info about CB prefixed instructions', () => {
      const instr = info.findInfo(0xCB37);
      assert.equal(instr.mnemonic, 'SWAP');
    });
  });
});
