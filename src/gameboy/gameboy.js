import { CPU } from './processor';
import { MMU } from './memory';
import { GPU, Screen } from './gpu';
import IORegister from './input/io-register';
import Interrupts from './input/interrupts';

export default class Gameboy {
  constructor(canvas) {
    this.interrupts = new Interrupts();
    this.gpu = new GPU(new Screen(canvas), this.interrupts);
    this.io = new IORegister(this.gpu);
    const vidMem = this.gpu.getVideoMemory();
    const attTab = this.gpu.getAttributeTable();
    this.memory = new MMU(vidMem, attTab, this.io, this.interrupts);
    this.core = new CPU(this.memory, this.interrupts, tick => this.gpu.step(tick));
    this.interval = null;
  }

  start(data) {
    this.loadRom(data);
    this.interval = setInterval(() => this.core.loop(), 1);
  }

  pause() {
    if (this.interval != null) clearInterval(this.interval);
    this.core.recorder.printHistory();
  }

  reset() {
    if (this.interval != null) clearInterval(this.interval);
    this.gpu.reset();
    this.core.reset();
    this.memory.reset();
  }

  loadRom(data) {
    this.memory.load(data);
  }
}
