import { Registers, opcodes, Z80 } from './';
import cycles from './instruction-timing';
import Recorder from '../../info/recorder';
/* eslint no-bitwise: 0 */

export default class ProcessorCore {
  constructor(memoryController, interruptHandler, notifyGpu) {
    this.mmu = memoryController;
    this.timer = memoryController.timer;
    this.interrupts = interruptHandler;
    this.notifyGpu = !notifyGpu ? () => {} : notifyGpu;
    this.reg = new Registers();
    this.clock = { clockCycles: 0 };
    this.actions = { stop: false, halt: false };
    this.currentOp = 0x00;
    this.currentPc = 0;
    this.isCB = false;
    this.currentInstruction = null;
    this.recorder = new Recorder();
    this.numVSync = 0;
    this.startDebug = false;
    this.oldCycleCount = 0;
  }

  fetch() {
    this.oldCycleCount = this.clock.clockCycles;
    const pc = this.reg.pc();
    this.currentPc = pc;
    this.currentOp = this.mmu.readByte(pc);
    this.reg.pc(pc + 1);
  }

  decode() {
    let op = this.currentOp;
    this.isCB = false;
    if (this.isOpAModifier()) {
      op = this.readNextOpAfterModiferAndCombine(op);
      this.currentOp = op;
      this.isCB = true;
      this.clock.clockCycles += 4;
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

    const timeSpent = this.currentInstruction(state);
    this.clock.clockCycles += timeSpent.t;
    const elapsed = this.clock.clockCycles - this.oldCycleCount;
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
    const oneFrame = this.clock.clockCycles + 70224;
    while (this.clock.clockCycles < oneFrame) {
      if (this.actions.halt) {
        this.handleHalt();
      } else {
        this.fetch();
        this.decode();
        this.execute();
      }
      if (this.interrupts.enabled) this.handleInterrupts();
    }
  }
  handleHalt() {
    if (this.interrupts.anyTriggered()) {
      this.actions.halt = false;
    }
    this.clock.clockCycles += 4;
    this.timer.increment(4);
    this.notifyGpu(4);
  }

  handleInterrupts() {
    if (!this.interrupts.anyTriggered()) return;
    this.interrupts.enabled = false;
    if (this.interrupts.checkVblankTriggered()) {
      this.numVSync += 1;
      this.callRst(0x0040);
    }
    if (this.interrupts.checkLcdStatTriggered()) this.callRst(0x0048);
    if (this.interrupts.checkTimerTriggered()) this.callRst(0x0050);
    if (this.interrupts.checkSerialTriggered()) this.callRst(0x0058);
    if (this.interrupts.checkJoypadTriggered()) this.callRst(0x0060);
  }

  callRst(num) {
    this.interrupts.enabled = false;
    const state = { mmu: this.mmu, map: this.reg.map };
    const timeSpent = Z80.subroutine.rst(state, num);
    this.clock.clockCycles += (4 * 4) + 4;
  }

  reset() {
    this.reg = new Registers();
    this.clock.clockCycles = 0;
    this.currentOp = 0x00;
    this.currentPc = 0;
  }
}
