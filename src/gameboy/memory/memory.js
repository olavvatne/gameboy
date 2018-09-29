export default class Memory {
  constructor(size) {
    this._memory = new Uint8Array(size);
  }

  readByte(address) {
    return this._memory[address];
  }

  writeByte(address, value) {
    this._memory[address] = value;
  }
}
