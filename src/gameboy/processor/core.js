import { Registers, opcodes } from './';

export default class ProcessorCore {
  constructor(memoryController) {
    this.mmu = memoryController;
    this.reg = new Registers();
    this.clock = { machineCycles: 0, clockCycles: 0 };
    this.interupts = { enable: true };
    this.currentOp = 0x00;
    this.currentInstruction = null;
    this.running = false;
  }

  fetch() {
    const pc = this.reg.pc();
    // TODO: Check if displacement code
    this.currentOp = this.mmu.readByte(pc);
    this.reg.pc(pc + 1);
  }

  decode() {
    this.currentInstruction = opcodes[this.currentOp];
  }

  execute() {
    // TODO: interupt. Send in temp interup object
    const state = { reg: this.reg, mmu: this.mmu, interupt: this.interupts };
    const timeSpent = this.currentInstruction(state);

    this.clock.machineCycles += timeSpent.m;
    this.clock.clockCycles += timeSpent.t;
  }

  start() {
    this.running = true;
    while (this.running) {
      this.fetch();
      this.decode();
      this.execute();
    }
  }

  stop() {
    this.running = false;
  }
}
