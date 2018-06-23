const memorySize = 2 ** 16;

export default class MemoryCore {
  constructor() {
    this._mem_buffer = new ArrayBuffer(memorySize);
    this._memory = new Uint8Array(this._mem_buffer);
  }

  readByte(address) {
    return this._memory[address];
  }

  writeByte(address, value) {
    this._memory[address] = value;
  }

  getAll() {
    return this._memory;
  }
}
