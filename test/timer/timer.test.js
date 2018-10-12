import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import MMU from '../../src/gameboy/memory/controller';

/* eslint prefer-destructuring: 0 */
/* eslint no-bitwise: 0 */
describe('Misc', () => {
  let timer = null;
  let mmu = null;

  beforeEach(() => {
    mmu = new MMU();
    timer = mmu.timer;
  });

  describe('Timer tests', () => {
    it('can read div timer from mmu', () => {
      const cycles = 128;
      timer.increment(cycles);
      assert.equal(mmu.readByte(0xFF04), 0);
      timer.increment(cycles);
      assert.equal(mmu.readByte(0xFF04), 1);
    });

    it('revert div timer to 0 when reaching 256', () => {
      const cycles = 256;
      timer.increment(255 * cycles);
      assert.equal(mmu.readByte(0xFF04), 255);
      timer.increment(cycles);
      assert.equal(mmu.readByte(0xFF04), 0);
    });

    it('keeps cycles after a div timer reset', () => {
      const cycles = 256;
      timer.increment((256 * cycles) + 4);
      assert.equal(timer.divCounter, 4);
    });

    it('does not increment tima timer if not enabled', () => {
      timer.increment(256);
      assert.equal(mmu.readByte(0xFF05), 0);
    });

    it('enables tima counter by writing bit 2 to FF07', () => {
      mmu.writeByte(0xFF07, 0b00000100);
      assert.isTrue(timer.timaEnabled);
    });

    it('increment tima counter', () => {
      timer.timaEnabled = true;
      timer.increment(1024); // default speed
      assert.equal(mmu.readByte(0xFF05), 1);
    });

    it('can increment tima at set speed', () => {
      // Enable tima and set 65536Hz speed
      mmu.writeByte(0xFF07, 0b00000110);
      const oneIncrement = 64;
      timer.increment(oneIncrement - 1);
      assert.equal(mmu.readByte(0xFF05), 0);
      timer.increment(1);
      assert.equal(mmu.readByte(0xFF05), 1);
    });

    it('reset when it overflows to modulo value and trigger timer', () => {
      // Enable tima and set 262144Hz speed
      mmu.writeByte(0xFF07, 0b00000101);
      const moduloVal = 5;
      mmu.writeByte(0xFF06, moduloVal);
      const oneIncrement = 16;

      for (let i = 0; i < 256; i += 1) {
        timer.increment(oneIncrement);
      }

      assert.equal(mmu.readByte(0xFF05), moduloVal);
      const timerFlag = mmu.interrupts.getInterruptFlags() & 4;
      assert.isTrue(timerFlag > 0);
    });
  });
});
