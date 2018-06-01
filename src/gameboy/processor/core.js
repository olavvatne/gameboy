import Registers from './';

export default class ProcessorCore {
  constructor(memoryController) {
    this.memCon = memoryController
    this.reg = new Registers();
  }
}
