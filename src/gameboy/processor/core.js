import { Registers, opcodes, Z80 } from './';
import Recorder from '../../info/recorder';
/* eslint no-bitwise: 0 */

export default class ProcessorCore {
  constructor(memoryController, interruptHandler, notifyGpu) {
    this.mmu = memoryController;
    this.timer = memoryController.timer;
    this.interrupts = interruptHandler;
    this.notifyGpu = !notifyGpu ? () => {} : notifyGpu;
    this.reg = new Registers();
    this.clockCycles = 0;
    this.actions = { stop: false, halt: false };
    this.currentOp = 0x00;
    this.currentPc = 0;
    this.currentInstruction = null;
    this.recorder = new Recorder();
    this.numVSync = 0;
    this.startDebug = false;
    this.oldCycleCount = 0;
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
      // this.recorder.printHistory();
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
    this.oldCycleCount = this.clockCycles;
    const cyclesSpent = this.currentInstruction(state);
    this.clockCycles += cyclesSpent;
    const elapsed = this.clockCycles - this.oldCycleCount;
    this.timer.increment(elapsed);
    this.notifyGpu(elapsed);
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
    const oneFrame = this.clockCycles + 70224;
    while (this.clockCycles < oneFrame) {
      if (this.actions.halt) {
        this.handleHalt();
      } else {
        this.fetch();
        this.decode();
        this.execute();
        if (this.interrupts.enabled) this.handleInterrupts();
      }
    }
  }
  handleHalt() {
    if (this.interrupts.enabled) {
      this.handleInterrupts();
    } else if (this.interrupts.anyTriggered()) {
      this.actions.halt = false;
    }
    this.clockCycles += 4;
    this.timer.increment(4);
    this.notifyGpu(4);
  }

  handleInterrupts() {
    if (!this.interrupts.anyTriggered()) return;

    if (this.interrupts.checkVblankTriggered()) {
      this.numVSync += 1;
      this.callRst(0x0040);
    } else if (this.interrupts.checkLcdStatTriggered()) this.callRst(0x0048);
    else if (this.interrupts.checkTimerTriggered()) this.callRst(0x0050);
    else if (this.interrupts.checkSerialTriggered()) this.callRst(0x0058);
    else if (this.interrupts.checkJoypadTriggered()) this.callRst(0x0060);
  }

  callRst(num) {
    this.interrupts.enabled = false;
    this.actions.halt = false;
    const state = { mmu: this.mmu, map: this.reg.map };
    const cyclesSpent = Z80.subroutine.rst(state, num);
    this.clockCycles += cyclesSpent + 4;
  }

  reset() {
    this.reg = new Registers();
    this.clockCycles = 0;
    this.currentOp = 0x00;
    this.currentPc = 0;
  }
}
