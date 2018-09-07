import { CPU } from './processor';
import { MMU } from './memory';
import { GPU } from './gpu';
import IORegister from './input/io-register';

export default class Gameboy {
  constructor(canvas) {
    this.gpu = new GPU(canvas);
    this.io = new IORegister(this.gpu);
    this.memory = new MMU(this.gpu.getVideoMemory(), this.gpu.getAttributeTable(), this.io);
    this.core = new CPU(this.memory, tick => this.gpu.step(tick));
  }

  start() {
    return this.core.start();
  }

  stop() {
    this.core.stop();
  }

  // TODO: Create a load method.
}
