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
    this.actions = { stop: false, halt: false };
    this.currentOp = 0x00;
    this.currentPc = 0;
    this.currentInstruction = null;
    this.recorder = new Recorder();
    this.startDebug = false;
  }

  fetch() {
    const pc = this.reg.pc();
    this.currentPc = pc;
    this.currentOp = this.mmu.readByte(pc);
    this.reg.pc(pc + 1);
  }

  decode() {
    let op = this.currentOp;
    if (this.isOpAModifier()) {
      op = this.readNextOpAfterModiferAndCombine(op);
      this.currentOp = op;
    }

    if (opcodes[op] === undefined) {
      this.recorder.printHistory();
      throw new Error(`opcode not impl: ${op.toString(16)}`);
    }
    this.currentInstruction = opcodes[op];
  }

  execute() {
    const state = {
      mmu: this.mmu,
      interrupt: this.interrupts,
      map: this.reg.map,
      actions: this.actions,
    };
    const timeSpent = this.currentInstruction(state);
    this.clock.machineCycles += timeSpent.m;
    this.clock.clockCycles += timeSpent.t;

    this.notifyGpu(timeSpent.t);
  }

  isOpAModifier() {
    return this.currentOp === 0xCB;
  }

  readNextOpAfterModiferAndCombine(op) {
    this.fetch();
    const nextOp = this.currentOp;
    return (op << 8) + nextOp;
  }

  setActions(pauseAction) {
    this.pause = pauseAction;
  }

  loop() {
    const oneFrame = this.clock.clockCycles + 70224;
    while (this.clock.clockCycles < oneFrame) {
      this.fetch();
      this.decode();
      this.recorder.record(this.currentOp, this.currentPc, this.reg.getState());
      this.execute();
      if (this.actions.stop || this.actions.halt) {
        this.pause();
        break;
      }
      if (this.interrupts.enabled) this.handleInterrupts();
    }
  }

  handleInterrupts() {
    if (!this.interrupts.anyTriggered()) return;
    if (this.interrupts.checkVblankTriggered()) this.callRst(0x0040);
    if (this.interrupts.checkLcdStatTriggered()) this.callRst(0x0048);
    if (this.interrupts.checkTimerTriggered()) this.callRst(0x0050);
    if (this.interrupts.checkSerialTriggered()) this.callRst(0x0058);
    if (this.interrupts.checkJoypadTriggered()) this.callRst(0x0060);
  }

  callRst(num) {
    this.interrupts.enabled = false;
    const state = { mmu: this.mmu, map: this.reg.map };
    const timeSpent = Z80.subroutine.rst(state, num);
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
