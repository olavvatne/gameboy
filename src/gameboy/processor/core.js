import memoryController from ''

class Core {
  constructor(memoryController) {
    this.memCon = memoryController
    this.reg = new Registers();
  }
}

export default Core;
