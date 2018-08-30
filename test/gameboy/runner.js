import * as fs from 'fs';
import * as path from 'path';
import { CPU, RegMap } from '../../src/gameboy/processor';
import { Memory } from '../../src/gameboy/memory';
import OpcodeInfoManager from '../../src/info/info-manager';
/* eslint no-console: 0 */

const logo = [
  0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
  0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e, 0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
  0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc, 0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
];

const checksum = [
  0x00, 0x4D, 0x41, 0x52, 0x49, 0x4F, 0x27, 0x53, 0x20, 0x50, 0x49, 0x43, 0x52, 0x4F, 0x53, 0x53,
  0x00, 0x30, 0x31, 0x03, 0x03, 0x03, 0x02, 0x01, 0x33, 0x00, 0x19,
];

export default class TestRunner {
  constructor() {
    this.memory = new Memory();
    this.core = new CPU(this.memory);
    const opcodesInfoJson = fs.readFileSync(path.resolve(__dirname, '../../src/info/opcodes.json'));
    this.info = new OpcodeInfoManager(opcodesInfoJson);
    this.putLogoInMem();
    this.putChecksumInMem();
  }
  putLogoInMem() {
    for (let i = 0; i < logo.length; i += 1) {
      this.memory.writeByte(0x104 + i, logo[i]);
    }
  }

  putChecksumInMem() {
    for (let i = 0; i < checksum.length; i += 1) {
      this.memory.writeByte(0x134 + i, checksum[i]);
    }
  }

  testBootstrap() {
    let startPrinting = false;
    while (this.core.reg.pc() !== 0x0100) {
      // gpu need to write to vertical-blank period register. Mock it here
      if (this.core.reg.pc() === 0x66) {
        this.memory.writeByte(0xFF44, 144);
      }
      if (this.core.reg.pc() === 0xE0) {
        startPrinting = true;
      }
      if (this.core.reg.pc() === 0xF9) {
        console.log("did run without issue");
      }
      this.core.fetch();
      this.core.decode();
      if (startPrinting) {
        this.printCurrent();
        this.printState();
      }
     
      this.core.execute();
    }
   
    console.log("did run without issue");
  }

  printCurrent() {
    console.log(this.info.getDescription(this.core.currentOp));
  }

  printState() {
    const state = this.core.reg.getState();
    console.log(Object.keys(state).map(key => ` ${key}: ${state[key]}`).join());
  }
}
