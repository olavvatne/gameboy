import { CPU } from './processor';
import { Memory } from './memory';

export default class Gameboy {
  constructor() {
    // TODO: supply canvas elements
    this.memory = new Memory();
    this.core = new CPU(this.memory);
  }
}
