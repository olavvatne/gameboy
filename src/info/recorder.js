import OpcodeInfoManager from './info-manager';

/* eslint no-bitwise: 0 */
/* eslint no-console: 0 */
const getHex = pc => `${(pc & 0xFFFF).toString(16)}`;

export default class Recorder {
  constructor() {
    this.history = new Array(100);
    this.pos = 0;
    this.opcodeInfo = new OpcodeInfoManager();
  }

  getPreviousRecord(offset) {
    const cur = Math.abs((this.pos - 1 - offset) % this.history.length);
    return this.history[cur];
  }

  record(op, pc = -1, state = null) {
    this.history[this.pos] = { op, pc, state };
    this.pos = (this.pos + 1) % this.history.length;
  }

  /* istanbul ignore next */
  printCurrent(op, pc, clock, state) {
    console.log(this.getCurrent(op, pc, clock, state));
  }

  getCurrent(op, pc, clock, state) {
    const info = this.opcodeInfo.getDescription(op);
    const hexPc = getHex(pc);
    if (!state) {
      return `${hexPc}, ${getHex(op)}, ${info}`;
    }

    return `${hexPc}, ${getHex(op)}, ${info} 
      A:${state.a} B:${state.b} C:${state.c} D:${state.d} E:${state.e} F:${state.f} H:${state.h} L:${state.l} SP:${state.sp} ${clock}`;
  }

  /* istanbul ignore next */
  printHistory() {
    console.log(this.getHistory());
  }

  getHistory() {
    const historyInOrder = [];
    for (let i = 0; i < this.history.length; i += 1) {
      const cur = Math.abs((this.pos - 1 - i) % this.history.length);
      if (this.history[cur]) {
        const hist = this.history[cur];
        const instr = this.getCurrent(hist.op, hist.pc, '', hist.state);
        historyInOrder.push(instr);
      } else {
        historyInOrder.push('----');
      }
    }
    return historyInOrder;
  }
}
