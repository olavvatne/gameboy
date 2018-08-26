import bios from './bios';

/* eslint no-bitwise: 0 */

const memorySize = 2 ** 16;

export default class MemoryCore {
  constructor() {
    this._mem_buffer = new ArrayBuffer(memorySize);
    this._memory = new DataView(this._mem_buffer);
    this._inBios = true;
  }

  exitBios() {
    this._inBios = false;
  }

  readByte(address) {
    if (address < 0x0100 && this._inBios) {
      return bios[address];
    }

    return this._memory.getUint8(address);
  }

  readWord(address) {
    return this._memory.getUint16(address, true);
  }

  writeByte(address, value) {
    this._memory.setUint8(address, value, true);
  }

  writeWord(address, value) {
    this._memory.setUint16(address, value, true);
  }

  getAll() {
    return new Uint8Array(this._mem_buffer);
  }
}
