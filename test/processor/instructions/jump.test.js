import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { Z80, RegMap, CheckFlagFor } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
describe('Processor', () => {
  let state = null;
  beforeEach(() => {
    state = getEmptyState();
  });

  describe('Jumps - instruction set tests', () => {
    it('jumps using the two immediate bytes', () => {
      const jumpTo = 0x4100;
      state.reg.pc(0x2000);
      state.mmu.writeWord(0x2000, jumpTo);
      Z80.jump.jp(state);

      assert.equal(state.reg.pc(), jumpTo);
    });

    it('jumps if Z is reset', () => {
      const jumpTo = 0x4100;
      state.reg.pc(0x2000);
      state.mmu.writeWord(0x2000, jumpTo);
      Z80.jump.jpIfZ(state, false);

      assert.equal(state.reg.pc(), jumpTo);
    });

    it('jumps if Z is set', () => {
      const jumpTo = 0x4500;
      const noJump = 0x2100;
      state.reg.pc(0x2100);
      state.mmu.writeWord(0x2100, jumpTo);
      Z80.jump.jpIfZ(state, true);
      assert.equal(state.reg.pc(), noJump);

      state.reg.reg(RegMap.f, new CheckFlagFor().zero(0).get());
      Z80.jump.jpIfZ(state, true);
      assert.equal(state.reg.pc(), jumpTo);
    });

    it('jumps if C is reset', () => {
      const jumpTo = 0x1500;
      const noJump = 0x1100;
      state.reg.pc(0x1100);
      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(true).get());
      state.mmu.writeWord(0x1100, jumpTo);
      Z80.jump.jpIfC(state, false);
      assert.equal(state.reg.pc(), noJump);

      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(false).get());
      Z80.jump.jpIfC(state, false);
      assert.equal(state.reg.pc(), jumpTo);
    });

    it('jumps if C is set', () => {
      const jumpTo = 0x1500;
      const noJump = 0x1100;
      state.reg.pc(0x1100);
      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(false).get());
      state.mmu.writeWord(0x1100, jumpTo);
      Z80.jump.jpIfC(state, true);
      assert.equal(state.reg.pc(), noJump);

      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(true).get());
      Z80.jump.jpIfC(state, true);
      assert.equal(state.reg.pc(), jumpTo);
    });

    it('jumps by putting hl into pc', () => {
      state.reg.reg(RegMap.hl, 0x1234);

      Z80.jump.jpHL(state);

      assert.equal(state.reg.reg(RegMap.hl), state.reg.pc());
    });

    it('can read next immediate and add it to pc to jump', () => {
      state.reg.pc(0x1200);
      state.mmu.writeByte(0x1200, 0x10);

      Z80.jump.jr(state);

      assert.equal(state.reg.pc(), 0x1200 + 0x10);
    });

    it('jumps to pc + immediate if Z is reset', () => {
      const jumpTo = 0xFF;
      const noJump = 0x1100;
      state.reg.pc(0x1100);
      state.reg.reg(RegMap.f, new CheckFlagFor().zero(0).get());
      state.mmu.writeByte(0x1100, jumpTo);
      Z80.jump.jrIfZ(state, false);
      assert.equal(state.reg.pc(), noJump);

      state.reg.reg(RegMap.f, new CheckFlagFor().zero(1).get());
      Z80.jump.jrIfZ(state, false);
      assert.equal(state.reg.pc(), noJump + jumpTo);
    });

    it('jumps to pc + immediate if Z is set', () => {
      const jumpTo = 0xFF;
      const noJump = 0x1100;
      state.reg.pc(0x1100);
      state.reg.reg(RegMap.f, new CheckFlagFor().zero(1).get());
      state.mmu.writeByte(0x1100, jumpTo);
      Z80.jump.jrIfZ(state, true);
      assert.equal(state.reg.pc(), noJump);

      state.reg.reg(RegMap.f, new CheckFlagFor().zero(0).get());
      Z80.jump.jrIfZ(state, true);
      assert.equal(state.reg.pc(), noJump + jumpTo);
    });

    it('jumps to pc + immediate if C is reset', () => {
      const jumpTo = 0xFF;
      const noJump = 0x1100;
      state.reg.pc(0x1100);
      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(true).get());
      state.mmu.writeByte(0x1100, jumpTo);
      Z80.jump.jrIfC(state, false);
      assert.equal(state.reg.pc(), noJump);

      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(false).get());
      Z80.jump.jrIfC(state, false);
      assert.equal(state.reg.pc(), noJump + jumpTo);
    });

    it('jumps to pc + immediate if C is set', () => {
      const jumpTo = 0xFF;
      const noJump = 0x1100;
      state.reg.pc(0x1100);
      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(false).get());
      state.mmu.writeByte(0x1100, jumpTo);
      Z80.jump.jrIfC(state, true);
      assert.equal(state.reg.pc(), noJump);

      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(true).get());
      Z80.jump.jrIfC(state, true);
      assert.equal(state.reg.pc(), noJump + jumpTo);
    });
  });
});
