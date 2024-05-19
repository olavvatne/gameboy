import { assert } from 'chai';
import { it, beforeEach, describe } from 'mocha';
import { Z80, CheckFlagFor } from '../../../src/gameboy/processor/index.js';
import getEmptyState from '../../helper/state-helper.js';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
/* eslint prefer-destructuring: 0 */
describe('Processor', () => {
  let state = null;
  let reg = null;
  let mmu = null;
  const pcMemAddr = 0x9100;

  beforeEach(() => {
    state = getEmptyState();
    reg = state.map;
    mmu = state.mmu;
  });

  describe('Jumps - instruction set tests', () => {
    it('jumps using the two immediate bytes', () => {
      const jumpTo = 0x9100;
      reg.pc(0xC000);
      mmu.writeWord(0xC000, jumpTo);
      Z80.jump.jp(state);

      assert.equal(reg.pc(), jumpTo);
    });

    it('jumps if Z is reset', () => {
      const jumpTo = 0xC100;
      reg.pc(0x9000);
      mmu.writeWord(0x9000, jumpTo);
      Z80.jump.jpIfZ(state, false);

      assert.equal(reg.pc(), jumpTo);
    });

    it('jumps if Z is set', () => {
      const jumpTo = 0x9500;
      const noJump = 0xA100;
      reg.pc(noJump);
      mmu.writeWord(noJump, jumpTo);
      Z80.jump.jpIfZ(state, true);
      assert.equal(reg.pc(), noJump + 2);
      reg.pc(noJump);

      reg.f(new CheckFlagFor().zero(0).get());
      Z80.jump.jpIfZ(state, true);
      assert.equal(reg.pc(), jumpTo);
    });

    it('jumps if C is reset', () => {
      const jumpTo = 0x9500;
      const noJump = 0x9100;
      reg.pc(noJump);
      reg.f(new CheckFlagFor().setC(true).get());
      mmu.writeWord(noJump, jumpTo);
      Z80.jump.jpIfC(state, false);
      assert.equal(reg.pc(), noJump + 2);
      reg.pc(noJump);

      reg.f(new CheckFlagFor().setC(false).get());
      Z80.jump.jpIfC(state, false);
      assert.equal(reg.pc(), jumpTo);
    });

    it('jumps if C is set', () => {
      const jumpTo = 0x9500;
      const noJump = 0x9100;
      reg.pc(noJump);
      reg.f(new CheckFlagFor().setC(false).get());
      mmu.writeWord(noJump, jumpTo);
      Z80.jump.jpIfC(state, true);
      assert.equal(reg.pc(), noJump + 2);
      reg.pc(noJump);

      reg.f(new CheckFlagFor().setC(true).get());
      Z80.jump.jpIfC(state, true);
      assert.equal(reg.pc(), jumpTo);
    });

    it('jumps by putting hl into pc', () => {
      reg.hl(0x9234);

      Z80.jump.jpHL(state);

      assert.equal(reg.hl(), reg.pc());
    });

    it('can read next immediate and add it to pc to jump', () => {
      const pcAddr = 0xB200;
      reg.pc(pcAddr);
      mmu.writeByte(pcAddr, 0x10);

      Z80.jump.jr(state);

      assert.equal(reg.pc(), pcAddr + 0x10 + 1);
    });

    it('works with signed bytes as well', () => {
      const jumpTo = -5;
      const pcAddr = 0xB200;
      reg.pc(pcAddr);
      mmu.writeByte(pcAddr, 0b11111011); // -5

      Z80.jump.jr(state);

      assert.equal(reg.pc(), pcAddr + jumpTo + 1);
    });

    it('jumps to pc + immediate if Z is reset', () => {
      const signedJumpTo = 0xE7; // signed format so this is actually -25
      const actualJumpTo = -25;
      const noJump = 0xA100;
      reg.pc(noJump);
      reg.f(new CheckFlagFor().zero(0).get());
      mmu.writeByte(noJump, signedJumpTo);
      Z80.jump.jrIfZ(state, false);
      assert.equal(reg.pc(), noJump + 1);
      reg.pc(noJump);

      reg.f(new CheckFlagFor().zero(1).get());
      Z80.jump.jrIfZ(state, false);
      assert.equal(reg.pc(), noJump + actualJumpTo + 1);
    });

    it('jumps to pc + immediate if Z is set', () => {
      const jumpTo = 0x7F; // twos complement. 7th bit is zero, so positve. 127
      const noJump = pcMemAddr;
      reg.pc(pcMemAddr);
      reg.f(new CheckFlagFor().zero(1).get());
      mmu.writeByte(pcMemAddr, jumpTo);
      Z80.jump.jrIfZ(state, true);
      assert.equal(reg.pc(), noJump + 1);
      reg.pc(pcMemAddr);

      reg.f(new CheckFlagFor().zero(0).get());
      Z80.jump.jrIfZ(state, true);
      assert.equal(reg.pc(), noJump + jumpTo + 1);
    });

    it('jumps to pc + immediate if C is reset', () => {
      const jumpTo = 0xFF; // negative num -> -1
      const noJump = pcMemAddr;
      reg.pc(pcMemAddr);
      reg.f(new CheckFlagFor().setC(true).get());
      mmu.writeByte(pcMemAddr, jumpTo);
      Z80.jump.jrIfC(state, false);
      assert.equal(reg.pc(), noJump + 1);
      reg.pc(pcMemAddr);

      reg.f(new CheckFlagFor().setC(false).get());
      Z80.jump.jrIfC(state, false);
      assert.equal(reg.pc(), noJump); // jumps negative 1 but need to increment PC as well
    });

    it('jumps to pc + immediate if C is set', () => {
      const jumpTo = 0x1F;
      const noJump = pcMemAddr;
      reg.pc(pcMemAddr);
      reg.f(new CheckFlagFor().setC(false).get());
      mmu.writeByte(pcMemAddr, jumpTo);
      Z80.jump.jrIfC(state, true);
      assert.equal(reg.pc(), noJump + 1);
      reg.pc(pcMemAddr);

      reg.f(new CheckFlagFor().setC(true).get());
      Z80.jump.jrIfC(state, true);
      assert.equal(reg.pc(), noJump + jumpTo + 1);
    });

    it('if no jump, it should still increment pc', () => {
      const jumpTo = 0x0F;
      const noJump = pcMemAddr;
      reg.pc(pcMemAddr);
      reg.f(new CheckFlagFor().zero(0).get());
      mmu.writeByte(pcMemAddr, jumpTo);
      Z80.jump.jrIfZ(state, false);

      assert.equal(reg.pc(), noJump + 1);
    });

    it('also increments pc if no jump on jrIfC', () => {
      const jumpTo = 0xFF;
      const noJump = pcMemAddr;
      reg.pc(pcMemAddr);
      reg.f(new CheckFlagFor().setC(false).get());
      mmu.writeByte(pcMemAddr, jumpTo);
      Z80.jump.jrIfC(state, true);
      assert.equal(reg.pc(), noJump + 1);
    });
  });
});
