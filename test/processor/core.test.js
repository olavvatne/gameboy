import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { CPU } from '../../src/gameboy/processor';
import { MMU } from '../../src/gameboy/memory';
import Interrupts from '../../src/gameboy/input/interrupts';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */

// Tests opcode map and utilizes the GB CPU manual to verify behaviour.
describe('Processor', () => {
  let cpu = null;
  let mmu = null;
  beforeEach(() => {
    mmu = new MMU();
    cpu = new CPU(mmu);
  });

  describe('Core tests', () => {
    it('notifies gpu after each cycle', () => {
      let called = 0;
      const gpuNotifier = () => {
        called += 1;
      };
      const core = new CPU(new MMU(), new Interrupts(), gpuNotifier);
      core.fetch();
      core.decode();
      assert.equal(called, 0);
      core.execute();
      assert.equal(called, 1);
      core.fetch();
      core.decode();
      core.execute();
      assert.equal(called, 2);
    });

    it('throws error if it ecounters unknown op', () => {
      mmu.exitBios();
      mmu.cartridge.rom[0x00] = 0xD3;
      cpu.fetch();
      assert.throws(() => cpu.decode());
    });

    it('executes instruction with modifier', () => {
      mmu.exitBios();
      mmu.cartridge.rom[0x00] = 0xCB;
      mmu.cartridge.rom[0x01] = 0xD3;
      cpu.fetch();
      cpu.decode();
      assert.equal(cpu.reg.map.e(), 0);
      cpu.execute();
      assert.isAbove(cpu.reg.map.e(), 0);
    });

    it('can reset state', () => {
      mmu.exitBios();
      mmu.cartridge.rom[0x00] = 0xCB;
      mmu.cartridge.rom[0x01] = 0xD3;
      cpu.fetch();
      cpu.decode();
      cpu.execute();

      assert.isAbove(cpu.reg.map.e(), 0);
      assert.isAbove(cpu.clock.clockCycles, 0);
      assert.isAbove(cpu.clock.machineCycles, 0);
      assert.isAbove(cpu.currentOp, 0);
      assert.isAbove(cpu.reg.pc(), 0);

      cpu.reset();

      assert.equal(cpu.reg.map.e(), 0);
      assert.equal(cpu.clock.clockCycles, 0);
      assert.equal(cpu.clock.machineCycles, 0);
      assert.equal(cpu.currentOp, 0);
      assert.equal(cpu.reg.pc(), 0);
    });
  });
});
