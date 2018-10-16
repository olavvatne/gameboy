import { CPU } from './processor';
import { MMU } from './memory';
import { GPU, Screen } from './gpu';
import IORegister from './io/io-register';
import Interrupts from './processor/interrupts';

export default class Gameboy {
  constructor(canvas) {
    this.canvas = canvas;
    this.interrupts = new Interrupts();
    this.gpu = new GPU(new Screen(canvas), this.interrupts);
    this.io = new IORegister(this.gpu);
    const vidMem = this.gpu.getVideoMemory();
    const attTab = this.gpu.getAttributeTable();
    this.memory = new MMU(vidMem, attTab, this.io, this.interrupts);
    this.core = new CPU(this.memory, this.interrupts, tick => this.gpu.step(tick));
    this.core.setActions(() => this.pause());
    this.interval = null;
  }

  start(data) {
    if (this.interval) return;

    this.loadRom(data);
    this.interval = setInterval(() => this.runForAWhile(), 1);
  }

  runForAWhile() {
    this.timeBeforeFrame = new Date();
    this.cyclesBeforeFrame = this.core.clockCycles;
    this.core.loop();
    this.syncTime();
    this.handleFpsCounter();
  }

  syncTime() {
    if (this.memory._inBios) return;
    let diffTime = (new Date() - this.timeBeforeFrame) / 1000;
    const diffCycles = this.core.clockCycles - this.cyclesBeforeFrame;
    const cyclesPerSec = 4194304;
    const virtualTimeElapsed = diffCycles / cyclesPerSec;
    // while (virtualTimeElapsed > diffTime) {
    //   diffTime = (new Date() - this.timeBeforeFrame) / 1000;
    // }
  }

  /* istanbul ignore next */
  handleFpsCounter() {
    if (this.core.numVSync > 0 && this.core.numVSync % 60 === 0) {
      const timeDiff = (new Date() - this.previousFpsTime) / 1000;
      this.fps = Math.round(60 / timeDiff);
      this.previousFpsTime = new Date();
    }
    if (this.previousFpsTime) {
      this.canvas.fillStyle = 'blue';
      this.canvas.font = '10px Arial';
      this.canvas.fillText(this.fps, 10, 10);
    }
  }

  pause() {
    if (this.interval != null) clearInterval(this.interval);
    this.interval = null;
  }

  reset() {
    this.pause();
    this.gpu.reset();
    this.core.reset();
    this.memory.reset();
  }

  loadRom(data) {
    this.memory.load(data);
  }
}
