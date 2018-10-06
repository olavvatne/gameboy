import { CPU } from './processor';
import { MMU } from './memory';
import { GPU, Screen } from './gpu';
import IORegister from './input/io-register';
import Interrupts from './input/interrupts';

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
    this.numFrames = 0;
  }

  start(data) {
    if (this.interval) return;

    this.loadRom(data);
    this.interval = setInterval(() => this.runAFrame(), 1);
  }

  runAFrame() {
    this.core.loop();
    this.handleFpsCounter();
  }

  handleFpsCounter() {
    if (this.numFrames === 0) this.t0 = new Date();
    this.numFrames += 1;
    if (this.numFrames >= 50) {
      this.numFrames = 0;
      this.fps = Math.round(50 / ((new Date() - this.t0) / 1000));
    }
    // TODO: is fps correct?
    this.canvas.fillStyle = 'blue';
    this.canvas.fillText(this.fps, 10, 10);
  }

  pause() {
    if (this.interval != null) clearInterval(this.interval);
  }

  reset() {
    if (this.interval != null) clearInterval(this.interval);
    this.interval = null;
    this.gpu.reset();
    this.core.reset();
    this.memory.reset();
  }

  loadRom(data) {
    this.memory.load(data);
  }
}
