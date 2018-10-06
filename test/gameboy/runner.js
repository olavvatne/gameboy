import { CPU } from '../../src/gameboy/processor';
import { MMU } from '../../src/gameboy/memory';
import OpcodeInfoManager from '../../src/info/info-manager';
/* eslint no-console: 0 */

const logo = [
  0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
  0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e, 0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
  0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc, 0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
];

const checksum = [
  0x54, 0x45, 0x54, 0x52, 0x49, 0x53, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x01, 0x0A,
];

export default class TestRunner {
  constructor() {
    this.memory = new MMU();
    this.core = new CPU(this.memory);
    this.info = new OpcodeInfoManager();
    this.putLogoInMem();
    this.putChecksumInMem();
  }
  putLogoInMem() {
    for (let i = 0; i < logo.length; i += 1) {
      this.memory.cartridge.rom[0x104 + i] = logo[i];
    }
  }

  putChecksumInMem() {
    for (let i = 0; i < checksum.length; i += 1) {
      this.memory.cartridge.rom[0x134 + i] = checksum[i];
    }
  }

  testBootstrap() {
    while (this.core.reg.pc() < 0x0100) {
      // gpu need to write to vertical-blank period register. Mock it here
      if (this.core.reg.pc() === 0x66) {
        this.memory.writeByte(0xFF44, 144);
      }

      this.core.fetch();
      this.core.decode();
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
