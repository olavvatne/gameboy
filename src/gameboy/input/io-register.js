import Memory from '../memory/memory';
import Util from '../util';

/* eslint no-bitwise: 0 */
const toByte = (arr) => {
  let val = arr[0];
  for (let i = 1; i < arr.length; i += 1) {
    val = (val << 1) + arr[i];
  }
  return val;
};

export default class IORegister extends Memory {
  constructor(gpu) {
    super(2 ** 7);
    this.keyColumns = [new Array(4).fill(1), new Array(4).fill(1)];
    this.currentColumn = 0;
    this._gpu = gpu;
  }

  readByte(address) {
    if (address === 0x00) return this.getKeys();
    if (address === 0x42) return this._gpu.registers.y;
    if (address === 0x43) return this._gpu.registers.x;
    if (address === 0x44) return this._gpu.renderTiming.getLine();
    return super.readByte(address);
  }

  writeByte(address, value) {
    super.writeByte(address, value);
    if (address === 0x00) this.currentColumn = value & 0x30;
    else if (address === 0x40) this._handleLCDC(value);
    else if (address === 0x42) this._gpu.registers.y = value;
    else if (address === 0x43) this._gpu.registers.x = value;
    else if (address === 0x47) this._gpu.setPalette(value, 'bg');
    else if (address === 0x48) this._gpu.setPalette(value, 'obj0');
    else if (address === 0x49) this._gpu.setPalette(value, 'obj1');
  }

  getKeys() {
    switch (this.currentColumn) {
      case 0x10: return toByte(this.keyColumns[0]);
      case 0x20: return toByte(this.keyColumns[1]);
      default: return 0x00;
    }
  }

  // TODO: custom mapping scheme
  handleKeyDown(event) {
    switch (event.key) {
      case 'Enter': this.keyColumns[0][3] = 0; break;
      case 'Space': this.keyColumns[0][2] = 0; break;
      case 'z': this.keyColumns[0][1] = 0; break;
      case 'x': this.keyColumns[0][0] = 0; break;
      case 'Down':
      case 'ArrowDown': this.keyColumns[1][3] = 0; break;
      case 'Up':
      case 'ArrowUp': this.keyColumns[1][2] = 0; break;
      case 'Left':
      case 'ArrowLeft': this.keyColumns[1][1] = 0; break;
      case 'Right':
      case 'ArrowRight': this.keyColumns[1][0] = 0; break;
      default: break;
    }
  }

  handleKeyUp(event) {
    switch (event.key) {
      case 'Enter': this.keyColumns[0][3] = 1; break;
      case 'Space': this.keyColumns[0][2] = 1; break;
      case 'z': this.keyColumns[0][1] = 1; break;
      case 'x': this.keyColumns[0][0] = 1; break;
      case 'Down':
      case 'ArrowDown': this.keyColumns[1][3] = 1; break;
      case 'Up':
      case 'ArrowUp': this.keyColumns[1][2] = 1; break;
      case 'Left':
      case 'ArrowLeft': this.keyColumns[1][1] = 1; break;
      case 'Right':
      case 'ArrowRight': this.keyColumns[1][0] = 1; break;
      default: break;
    }
  }

  _handleLCDC(value) {
    const bgOn = Util.getBit(value, 0);
    const spriteOn = Util.getBit(value, 1);
    this._gpu.registers.bg = bgOn;
    this._gpu.registers.sprite = spriteOn;
    this._gpu.registers.tilemap = Util.getBit(value, 3);
    this._gpu.registers.tilemapWindow = Util.getBit(value, 6);
    this._gpu.registers.tileset = Util.getBit(value, 4);
    if (Util.getBit(value, 7)) this._gpu.showImage();
    else this._gpu.removeImage();
  }
}
