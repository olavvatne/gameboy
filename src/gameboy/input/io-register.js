import Memory from '../memory/memory';
import Util from '../util';


export default class IORegister extends Memory {
  constructor(gpu) {
    super(2 ** 7);
    this._gpu = gpu;
  }

  readByte(address) {
    return super.readByte(address);
  }

  writeByte(address, value) {
    super.writeByte(address, value);
    if (address === 0x40) this._handleLCDC(value);
    if (address === 0x42) this._gpu.registers.y = value;
    else if (address === 0x43) this._gpu.registers.x = value;
  }

  _handleLCDC(value) {
    this.gpu.register.tilemap = Util.getBit(value, 6);
    this.gpu.register.tilemap = Util.getBit(value, 3);
    this.gpu.register.tileset = Util.getBit(value, 4);
    if (Util.getBit(value, 7)) this.gpu.showImage();
    else this.gpu.removeImage();
  }
}
