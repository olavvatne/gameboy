import Memory from '../memory/memory';
import Util from '../util';

/* eslint no-bitwise: 0 */

const tilesetAddressMax = 0x9800 & 0x1FFF;

export default class VideoMemory extends Memory {
  constructor(frameBuffer) {
    super(2 ** 13);
    this._frameBuffer = frameBuffer;
  }

  readByte(address) {
    return super.readByte(address);
  }

  writeByte(address, value) {
    super.writeByte(address, value);

    // Test if address falls inside tile set area.
    // Include both rows to update enable row update
    if (address < tilesetAddressMax) {
      // Identify first byte of tile row. Send both row bytes to update tile
      const firstAddr = address - (address % 2);
      const firstByte = this.readByte(firstAddr);
      const secondByte = this.readByte(firstAddr + 1);
      this._frameBuffer.updateTile(firstAddr, firstByte, secondByte);
    }
  }

  getTileAddressFromMap(tilemap, offset) {
    const mapAddr = tilemap ? 0x1C00 : 0x1800;
    const val = this.readByte(mapAddr + offset);
    return Util.convertSignedByte(val);
  }
}
