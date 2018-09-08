import Memory from '../memory/memory';
import Util from '../util';


export default class IORegister extends Memory {
  constructor(gpu) {
    super(2 ** 7);
    this._gpu = gpu;
  }

  readByte(address) {
    if (address === 0x44) return this._gpu.renderTiming.getLine();
    return super.readByte(address);
  }

  writeByte(address, value) {
    super.writeByte(address, value);
    if (address === 0x40) this._handleLCDC(value);
    else if (address === 0x42) this._gpu.registers.y = value;
    else if (address === 0x43) this._gpu.registers.x = value;
    // TODO: palette switch
  }

  _handleLCDC(value) {
    this._gpu.registers.tilemap = Util.getBit(value, 6);
    this._gpu.registers.tilemap = Util.getBit(value, 3);
    this._gpu.registers.tileset = Util.getBit(value, 4);
    if (Util.getBit(value, 7)) this._gpu.showImage();
    else this._gpu.removeImage();
  }
}
