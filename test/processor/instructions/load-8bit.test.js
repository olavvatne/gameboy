import { assert } from 'chai';
import { it } from 'mocha';
import { Z80, RegMap } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';
import { reg8bitList } from '../../helper/register-helper';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
describe('Processor', () => {
  describe('Load 8 bit - instruction set tests', () => {
    it('can load from register into memory address specfied by HL', () => {
      // Assumes that (HL) on page 67 of CPU manuel means put register into memory address HL
      const state = getEmptyState();
      state.reg.reg(RegMap.hl, 2005);
      state.reg.reg(RegMap.b, 230);
      state.reg.reg(RegMap.c, 105);

      Z80.load8.ldMemHLReg(state, RegMap.b);
      assert.equal(state.mmu.readByte(2005), 230);
      Z80.load8.ldMemHLReg(state, RegMap.c);
      assert.equal(state.mmu.readByte(2005), 105);
    });

    it('can load immediate value into A', () => {
      const state = getEmptyState();
      state.reg.pc(0x1220);
      state.mmu.writeByte(0x1220, 0xAA);

      Z80.load8.ldAImmediate(state);

      assert.equal(state.reg.pc(), 0x1221);
      assert.equal(state.reg.reg(RegMap.a), 0xAA);
    });

    it('can load into A the value from memory based on immediate word', () => {
      const state = getEmptyState();
      const pcVal = 0x00AB;
      state.reg.pc(pcVal);
      state.mmu.writeWord(0x0AB, 0x1234);
      state.mmu.writeByte(0x1234, 0xEF);

      Z80.load8.ldRegAImmediateWord(state);

      assert.equal(state.reg.pc(), pcVal + 2);
      assert.equal(state.reg.reg(RegMap.a), 0xEF);
    });

    it('can put register 8 bit value into immediate value', () => {
      // TODO: Need to verify if I understand this instruction correctly.
      const state = getEmptyState();
      const pcVal = 0x00AC;
      state.reg.pc(pcVal);

      reg8bitList.forEach((reg, idx) => {
        state.reg.reg(RegMap.b, 0x12 + idx);

        Z80.load8.ldImmediate(state, reg);

        const immediate = state.mmu.readByte(pcVal);
        assert.equal(state.reg.reg(reg), immediate);
      });
    });

    it('can put value from memory at address found in HL into a 8 bit register', () => {
      const state = getEmptyState();
      const memAddr = 0x1234;
      state.mmu.writeByte(memAddr, 0x59);

      assert.equal(state.reg.reg(RegMap.a), 0x00);
      reg8bitList.forEach((reg) => {
        state.reg.reg(RegMap.hl, memAddr);
        Z80.load8.ldMemHL(state, reg);
        assert.equal(state.reg.reg(reg), 0x59);
      });
    });

    it('puts value in memory at a location based on constant offset and register C into A', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.c, 30);
      state.mmu.writeByte(0xFF00 + 30, 0x92);

      Z80.load8.ldRegARegCPlusConst(state);

      assert.equal(state.reg.reg(RegMap.a), 0x92);
    });

    it('puts A into memory location based on reg C and an constant', () => {
      const state = getEmptyState();
      const correct = 0x43;
      state.reg.reg(RegMap.a, 0x43);
      state.reg.reg(RegMap.c, 0x11);

      Z80.load8.ldRegCPlusConstRegA(state);

      assert.equal(state.mmu.readByte(0xFF00 + 0x11), correct);
    });

    it('has an instruction which put value at addr HL into A and dec HL', () => {
      const state = getEmptyState();
      const addr = 0x3458;
      state.reg.reg(RegMap.hl, addr);
      state.mmu.writeByte(addr, 0x99);

      Z80.load8.lddRegAMemHL(state);

      assert.equal(state.reg.reg(RegMap.a), 0x99);
      assert.equal(state.reg.reg(RegMap.hl), addr - 1);
    });

    it('has instruction to put reg A into mem addr found at reg HL and dec HL', () => {
      const state = getEmptyState();
      const addr = 0x8273;
      state.reg.reg(RegMap.a, 0x75);
      state.reg.reg(RegMap.hl, addr);

      Z80.load8.lddMemHLRegA(state);

      assert.equal(state.mmu.readByte(addr), 0x75);
      assert.equal(state.reg.reg(RegMap.hl), addr - 1);
    });

    it('can put the immediate value into memory addr in HL', () => {
      const state = getEmptyState();
      state.reg.pc(0x5000);
      state.mmu.writeByte(0x5000, 0x43);
      state.reg.reg(RegMap.hl, 0x1234);

      Z80.load8.ldMemHLImmediate(state);

      assert.equal(state.mmu.readByte(0x1234), 0x43);
    });

    it('can put reg A val into memory addr found in the two immediate values', () => {
      const state = getEmptyState();
      state.reg.pc(0x2000);
      state.mmu.writeWord(0x2000, 0x6000);
      state.reg.reg(RegMap.a, 0x05);

      Z80.load8.ldImmediateA(state);

      assert.equal(state.mmu.readWord(0x6000), 0x05);
    });

    it('put value in mem addr FF00 plus immediate into register A', () => {
      const state = getEmptyState();
      state.reg.pc(0x1234);
      const immediateAddr = 0x1234;
      const immediateValue = 0x12;
      const corrValue = 0x89;
      state.mmu.writeByte(immediateAddr, 0x12);
      state.mmu.writeByte(immediateValue + 0xFF00, corrValue);
      state.reg.reg(RegMap.a, 0x12);

      Z80.load8.ldhRegAMemFF00PlusImmediate(state);

      assert.equal(state.reg.reg(RegMap.a), corrValue);
      const newCounter = state.reg.pc();
      assert.equal(newCounter, 0x1235);
    });
  });
});
