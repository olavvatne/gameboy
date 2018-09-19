import { CPU } from './processor';
import { MMU } from './memory';
import { GPU, Screen } from './gpu';
import IORegister from './input/io-register';

export default class Gameboy {
  constructor(canvas) {
    this.gpu = new GPU(new Screen(canvas));
    this.io = new IORegister(this.gpu);
    this.memory = new MMU(this.gpu.getVideoMemory(), this.gpu.getAttributeTable(), this.io);
    this.core = new CPU(this.memory, tick => this.gpu.step(tick));
    this.interval = null;
  }

  start() {
    this.interval = setInterval(() => this.core.loop(), 1);
  }

  pause() {
    if (this.interval != null) clearInterval(this.interval);
  }

  reset() {
    if (this.interval != null) clearInterval(this.interval);
    this.gpu.reset();
    this.core.reset();
    this.memory.reset();
  }
}
