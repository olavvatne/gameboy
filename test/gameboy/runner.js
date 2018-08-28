import * as fs from 'fs';
import * as path from 'path';
import { CPU } from '../../src/gameboy/processor';
import { Memory } from '../../src/gameboy/memory';
import OpcodeInfoManager from '../../src/info/info-manager';
/* eslint no-console: 0 */

export default class TestRunner {
  constructor() {
    this.memory = new Memory();
    this.core = new CPU(this.memory);
    const opcodesInfoJson = fs.readFileSync(path.resolve(__dirname, '../../src/info/opcodes.json'));
    this.info = new OpcodeInfoManager(opcodesInfoJson);
  }

  testBootstrap() {
    while (this.core.reg.pc() !== 0x0100) {
      this.core.fetch();
      this.core.decode();
      this.printCurrent();
      this.printState();
      if (this.core.currentOp === 0x77) {
        console.log('retirm');
      }
      this.core.execute();
    }
  }

  printCurrent() {
    console.log(this.info.getDescription(this.core.currentOp));
  }

  printState() {
    const state = this.core.reg.getState();
    console.log(Object.keys(state).map(key => ` ${key}: ${state[key]}`).join());
  }
}
