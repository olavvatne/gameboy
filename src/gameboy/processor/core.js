import { Registers, opcodes, Z80 } from './';
import Recorder from '../../info/recorder';
/* eslint no-bitwise: 0 */

export default class ProcessorCore {
  constructor(memoryController, interruptHandler, notifyGpu) {
    this.mmu = memoryController;
    this.interrupts = interruptHandler;
    this.notifyGpu = !notifyGpu ? () => {} : notifyGpu;
    this.reg = new Registers();
    this.clock = { machineCycles: 0, clockCycles: 0 };
    this.currentOp = 0x00;
    this.currentInstruction = null;
    this.recorder = new Recorder();
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
    const state = { mmu: this.mmu, interrupt: this.interrupts, map: this.reg.map };
    const timeSpent = this.currentInstruction(state);
    this.clock.machineCycles += timeSpent.m;
    this.clock.clockCycles += timeSpent.t;

    this.notifyGpu(timeSpent.t);
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
    // if (this.currentOp === 195) {
    //   this.recorder.printHistory();
    // }
    const oneFrame = this.clock.clockCycles + 70224;
    while (this.clock.clockCycles < oneFrame) {
      this.fetch();
      this.decode();
      this.execute();
      if (this.interrupts.enabled) this.handleInterrupts();
      // this.recorder.record(this.currentOp);
    }
  }

  handleInterrupts() {
    if (!this.interrupts.anyTriggered()) return;
    if (this.interrupts.checkVblankTriggered()) this.callRst(0x40);
    if (this.interrupts.checkLcdStatTriggered()) this.callRst(0x48);
    if (this.interrupts.checkTimerTriggered()) this.callRst(0x50);
    if (this.interrupts.checkSerialTriggered()) this.callRst(0x58);
    if (this.interrupts.checkJoypadTriggered()) this.callRst(0x60);
  }

  callRst(num) {
    const timeSpent = Z80.subroutine.rst({ mmu: this.mmu, map: this.reg.map }, num);
    this.clock.machineCycles += timeSpent.m;
    this.clock.clockCycles += timeSpent.t;
  }

  reset() {
    this.reg = new Registers();
    this.clock.machineCycles = 0;
    this.clock.clockCycles = 0;
    this.currentOp = 0x00;
  }
}
