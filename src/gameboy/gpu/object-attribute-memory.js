import Memory from '../memory/memory';
import Util from '../util';

/* eslint no-bitwise: 0 */

export default class OAM extends Memory {
  constructor() {
    super(2 ** 8);
    this.init();
  }

  init() {
    this.objects = new Array(40).fill().map(() => ({
      y: -16, x: -8, tile: 0, palette: 0, priority: 0,
    }));
  }

  reset() {
    this.init();
  }

  setMemoryReader(mmu) {
    this._mmu = mmu;
  }
  readByte(address) {
    return super.readByte(address);
  }

  writeByte(address, value) {
    super.writeByte(address, value);
    this.updateObject(address, value);
  }

  startDmaTransfer(value) {
    for (let i = 0; i < 160; i += 1) {
      const val = this._mmu.readByte((value << 8) + i);
      this.writeByte(i, val);
    }
  }

  updateObject(address, value) {
    const index = address >> 2;
    if (index >= 40) return;
    const sprite = this.objects[index];
    const field = address & 0x03;
    if (field === 0) {
      sprite.y = value - 16; // WHAT?
    } else if (field === 1) {
      sprite.x = value - 8; // what??
    } else if (field === 2) {
      sprite.tile = value;
    } else {
      sprite.palette = Util.getBit(value, 4);
      sprite.flipY = Util.getBit(value, 6);
      sprite.flipX = Util.getBit(value, 5);
      sprite.priority = Util.getBit(value, 7);
    }
  }
}
