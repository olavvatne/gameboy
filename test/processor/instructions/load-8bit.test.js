import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { Z80 } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';
import { reg8bitList } from '../../helper/register-helper';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
/* eslint prefer-destructuring: 0 */
describe('Processor', () => {
  let state = null;
  let reg = null;
  let mmu = null;
  beforeEach(() => {
    state = getEmptyState();
    reg = state.map;
    mmu = state.mmu;
  });

  describe('Load 8 bit - instruction set tests', () => {
    it('can load from register into memory address specfied by HL', () => {
      // Assumes that (HL) on page 67 of CPU manuel means put register into memory address HL
      reg.hl(2005);
      reg.b(230);
      reg.c(105);

      Z80.load8.ldMemHLReg(state, reg.b);
      assert.equal(mmu.readByte(2005), 230);
      Z80.load8.ldMemHLReg(state, reg.c);
      assert.equal(mmu.readByte(2005), 105);
    });

    it('can load immediate value into A', () => {
      reg.pc(0x1220);
      mmu.writeByte(0x1220, 0xAA);

      Z80.load8.ldAImmediate(state);

      assert.equal(reg.pc(), 0x1221);
      assert.equal(reg.a(), 0xAA);
    });

    it('can load into A the value from memory based on immediate word', () => {
      const pcVal = 0x01AB;
      reg.pc(pcVal);
      mmu.writeWord(0x01AB, 0x1234);
      mmu.writeByte(0x1234, 0xEF);

      Z80.load8.ldRegAImmediateWord(state);

      assert.equal(reg.pc(), pcVal + 2);
      assert.equal(reg.a(), 0xEF);
    });

    it('can put 8 bit immediate value into register', () => {
      const pcAddr = 0x0AC;
      const pcVal = 0x11;
      mmu.exitBios();
      reg.pc(pcAddr);

      reg8bitList.forEach((name, idx) => {
        mmu.writeWord(reg.pc(), pcVal + idx);

        Z80.load8.ldImmediate(state, reg[name]);

        const immediate = reg[name]();
        assert.equal(immediate, pcVal + idx);
      });
    });

    it('can put value from memory at address found in HL into a 8 bit register', () => {
      const memAddr = 0x1234;
      mmu.writeByte(memAddr, 0x59);

      assert.equal(reg.a(), 0x00);
      reg8bitList.forEach((name) => {
        reg.hl(memAddr);
        Z80.load8.ldMemHL(state, reg[name]);
        assert.equal(reg[name](), 0x59);
      });
    });

    it('puts value in memory at a location based on constant offset and register C into A', () => {
      reg.c(30);
      mmu.writeByte(0xFF00 + 30, 0x92);

      Z80.load8.ldRegARegCPlusConst(state);

      assert.equal(reg.a(), 0x92);
    });

    it('puts A into memory location based on reg C and an constant', () => {
      const correct = 0x43;
      reg.a(0x43);
      reg.c(0x11);

      Z80.load8.ldRegCPlusConstRegA(state);

      assert.equal(mmu.readByte(0xFF00 + 0x11), correct);
    });

    it('has an instruction which put value at addr HL into A and dec HL', () => {
      const addr = 0x3458;
      reg.hl(addr);
      mmu.writeByte(addr, 0x99);

      Z80.load8.lddRegAMemHL(state);

      assert.equal(reg.a(), 0x99);
      assert.equal(reg.hl(), addr - 1);
    });

    it('has instruction to put reg A into mem addr found at reg HL and dec HL', () => {
      const addr = 0x8273;
      reg.a(0x75);
      reg.hl(addr);

      Z80.load8.lddMemHLRegA(state);

      assert.equal(mmu.readByte(addr), 0x75);
      assert.equal(reg.hl(), addr - 1);
    });

    it('can put the immediate value into memory addr in HL', () => {
      state.reg.pc(0x5000);
      mmu.writeByte(0x5000, 0x43);
      reg.hl(0x1234);

      Z80.load8.ldMemHLImmediate(state);

      assert.equal(mmu.readByte(0x1234), 0x43);
    });

    it('can put reg A val into memory addr found in the two immediate values', () => {
      reg.pc(0x2000);
      mmu.writeWord(0x2000, 0x6000);
      reg.a(0x05);

      Z80.load8.ldImmediateA(state);

      assert.equal(mmu.readWord(0x6000), 0x05);
    });

    it('put value in mem addr FF00 plus immediate into register A', () => {
      state.reg.pc(0x1234);
      const immediateAddr = 0x1234;
      const immediateValue = 0x12;
      const corrValue = 0x89;
      mmu.writeByte(immediateAddr, 0x12);
      mmu.writeByte(immediateValue + 0xFF00, corrValue);
      reg.a(0x12);

      Z80.load8.ldhRegAMemFF00PlusImmediate(state);

      assert.equal(reg.a(), corrValue);
      assert.equal(reg.pc(), 0x1235);
    });

    it('can put mem val from address HL into reg c', () => {
      const addr = 0x3458;
      reg.hl(addr);
      mmu.writeByte(addr, 0x99);

      Z80.load8.ldMemHL(state, reg.c);

      assert.equal(reg.c(), 0x99);
    });

    it('can load value from reg bc mem location into a', () => {
      const addr = 0x3231;
      reg.bc(addr);
      mmu.writeByte(addr, 0x19);

      Z80.load8.ldRegAMem(state, reg.bc);

      assert.equal(reg.a(), 0x19);
    });
  });
});
