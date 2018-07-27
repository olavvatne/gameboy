import { CPU } from './processor';
import { Memory } from './memory';

export default class Gameboy {
  constructor() {
    // TODO: supply canvas elements
    this.memory = new Memory();
    this.core = new CPU(this.memory);
  }

  start() {
    this.core.start();
  }

  stop() {
    this.core.stop();
  }

  // TODO: Create a load method.
}
