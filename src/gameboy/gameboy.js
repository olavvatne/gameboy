import { CPU } from './processor';
import { MMU } from './memory';

export default class Gameboy {
  constructor() {
    // TODO: supply canvas elements
    this.memory = new MMU();
    this.core = new CPU(this.memory);
  }

  start() {
    return this.core.start();
  }

  stop() {
    this.core.stop();
  }

  // TODO: Create a load method.
}
