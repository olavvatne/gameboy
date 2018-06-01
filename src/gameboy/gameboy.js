import { Core } from './processor';

class Gameboy {
  constructor() {
    //TODO: supply canvas elements
    this.memoryController = new memoryController();
    this.core = new Core(memoryController)
  }
}
