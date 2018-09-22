const getHex = op => `0x${(op & 0x00FF).toString(16)}`;

export default class Recorder {
  constructor() {
    this.history = new Array(10000);
    this.pos = 0;
  }

  record(op) {
    this.history[this.pos] = op;
    this.pos = (this.pos + 1) % this.history.length;
  }

  printHistory() {
    const inOrder = new Array(10000);
    for (let i = 0; i < this.history.length; i += 1) {
      const cur = (this.pos + 1 + i) % this.history.length;
      inOrder[i] = getHex(this.history[cur]);
    }
    console.log(inOrder);
  }
}
