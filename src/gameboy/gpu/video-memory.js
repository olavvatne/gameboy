import Memory from '../memory/memory';

export default class VideoMemory extends Memory {
  constructor(size, frameBuffer) {
    super(size);
    this._frameBuffer = frameBuffer;
  }

  readByte(address) {
    super.readByte(address);
  }

  writeByte(address, value) {
    super.writeByte(address, value);
    this._frameBuffer.updateTile(address, value);
  }

  /* eslint class-methods-use-this: 0 */
  /* eslint no-unused-vars: 0 */
  writeWord(address, value) {
    // super.writeWord(address, value);
    throw new Error('Not needed?');
  }

  readWord(address) {
    throw new Error('Not needed?');
    // super.readWord(address);
  }
}
