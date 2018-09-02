export default class Memory {
  constructor(size) {
    this._mem_buffer = new ArrayBuffer(size);
    this._memory = new DataView(this._mem_buffer);
  }

  readByte(address) {
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
}
