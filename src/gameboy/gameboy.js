import { CPU } from './processor';
import { MMU } from './memory';
import { GPU } from './gpu';

export default class Gameboy {
  constructor(canvas) {
    this.gpu = new GPU(canvas);
    this.memory = new MMU(this.gpu.getVideoMemory(), this.gpu.getAttributeTable());
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
