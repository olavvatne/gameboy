import Memory from '../memory/memory';

export default class VideoMemory extends Memory {
  constructor(size, frameBuffer) {
    super(size);
    this._frameBuffer = frameBuffer;
  }

  readByte(address) {
    return super.readByte(address);
  }

  writeByte(address, value) {
    super.writeByte(address, value);
    this._frameBuffer.updateTile(address, value);
  }

  writeWord(address, value) {
    super.writeWord(address, value);
  }

  readWord(address) {
    return super.readWord(address);
  }
}
