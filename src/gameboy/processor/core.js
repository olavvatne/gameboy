import { Registers, opcodes } from './';

/* eslint no-bitwise: 0 */

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
    this.currentOp = this.mmu.readByte(pc);
    this.reg.pc(pc + 1);
  }

  decode() {
    let op = this.currentOp;
    if (this.isOpAModifier()) {
      op = this.readNextOpAfterModiferAndCombine(op);
      this.currentOp = op;
    }

    if (opcodes[op] === undefined) throw new Error(`opcode not impl: ${op.toString(16)}`);
    this.currentInstruction = opcodes[op];
  }

  execute() {
    // TODO: interupt. Send in temp interup object
    const state = { reg: this.reg, mmu: this.mmu, interupt: this.interupts };
    const timeSpent = this.currentInstruction(state);

    this.clock.machineCycles += timeSpent.m;
    this.clock.clockCycles += timeSpent.t;
  }

  isOpAModifier() {
    return this.currentOp === 0xCB || this.currentOp === 0x10;
  }

  readNextOpAfterModiferAndCombine(op) {
    this.fetch();
    const nextOp = this.currentOp;
    return (op << 8) + nextOp;
  }
  loop() {
    if (!this.running) {
      return;
    }
    this.fetch();
    this.decode();
    this.execute();

    setTimeout(() => {
      this.loop();
    }, 10);
  }
  start() {
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
  }
}
