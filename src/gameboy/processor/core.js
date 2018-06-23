import Registers from './';

export default class ProcessorCore {
  constructor(memoryController) {
    this.mem = memoryController;
    this.reg = new Registers();
    this.clock = { instructionTime: 0, totalTime: 0 };
  }

  fetch() {

  }

  decode() {

  }

  execute() {

  }

  start() {
    while(true) {
      this.fetch();
      this.decode();
      this.execute();
    }
  }
}
