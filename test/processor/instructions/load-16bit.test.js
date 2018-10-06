import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { Z80 } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';

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

  describe('Load 16 bit - instruction set tests', () => {
    it('can put immediate value into a 16 bit register', () => {
      reg.pc(0x4444);
      mmu.writeWord(0x4444, 0x1000);
      reg.de(0x9999);

      Z80.load16.ldImmediateIntoReg(state, reg.de);

      assert.equal(reg.de(), 0x1000);
    });

    it('can put HL into stack pointer', () => {
      reg.hl(0x3214);
      Z80.load16.ldRegToReg(state, reg.hl, reg.sp);
      assert.equal(reg.sp(), 0x3214);
    });

    it('can put SP + immediate value into HL and affect flags', () => {
      reg.sp(0x3333);
      reg.f(0x99);
      const imAddr = 0x7654;
      const imVal = 0x11;
      // Over 255. Will cause carry
      const correct = 0x3333 + 0x11;
      reg.pc(imAddr);
      mmu.writeWord(imAddr, imVal);
      Z80.load16.ldHLFromSPPlusImmediate(state);
      assert.equal(reg.hl(), correct);
      assert.equal(reg.f(), 0b00000000);
    });

    it('can put SP into address determined by immediate value', () => {
      const correct = 0xA212;
      const correctAddr = 0xA222;
      reg.sp(correct);
      const regAddr = 0xA545;
      reg.pc(regAddr);
      mmu.writeWord(regAddr, 0xA222);

      Z80.load16.ldSPIntoImmediate(state);

      assert.isAbove(reg.pc(), regAddr);
      assert.equal(mmu.readWord(correctAddr), correct);
    });

    it('can push a register pair onto stack', () => {
      const oldPointer = reg.sp();
      const correct = 0x8888;
      reg.de(correct);

      Z80.load16.push(state, reg.de);

      assert.equal(reg.sp(), oldPointer - 2);
      assert.equal(mmu.readWord(reg.sp()), correct);
    });

    it('works different with register pair AF', () => {
      const pcAddr = 0x5565;
      mmu.writeByte(pcAddr + 1, 0xAB);
      mmu.writeByte(pcAddr, 0xCD);
      reg.pc(pcAddr);

      Z80.load16.ldImmediateIntoReg(state, reg.af);

      assert.equal(reg.af(), 0xABC0);
    });

    it('can pop a pushed value on the stack', () => {
      const oldPointer = reg.sp();
      const correct = 0x7777;
      reg.bc(correct);

      Z80.load16.push(state, reg.bc);
      Z80.load16.pop(state, reg.de);

      assert.equal(reg.de(), correct);
      assert.equal(reg.sp(), oldPointer);
    });

    it('loads immediate into 16 bit register, with endian correct', () => {
      const val = 0xABCD;
      const pcAddr = 0x5565;
      mmu.writeByte(pcAddr + 1, 0xAB);
      mmu.writeByte(pcAddr, 0xCD);
      reg.pc(pcAddr);

      Z80.load16.ldImmediateIntoReg(state, reg.bc);

      assert.equal(reg.bc(), val);
    });
  });
});
