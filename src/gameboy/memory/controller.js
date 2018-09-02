import bios from './bios';
import Memory from './memory';
/* eslint no-bitwise: 0 */

const memorySize = 2 ** 16;

export default class MMU {
  constructor() {
    this._memory = new Memory(memorySize);
    this._rom0 = new Memory(2 ** 14);
    this._rom1 = new Memory(2 ** 14);
    this._tempUntilGPUVram = new Memory(2 ** 13);
    this._eram = new Memory(2 ** 13);
    this._wram = new Memory(2 ** 13);
    this._zram = new Memory(2 ** 7);
    this._tempIO = new Memory(2 ** 7);
    this._tempOAM = new Memory(2 ** 7);
    this._inBios = true;
  }

  exitBios() {
    this._inBios = false;
  }

  readByte(address) {
    switch (address & 0xF000) {
      // BIOS / ROM0
      case 0x0000:
        if (address < 0x0100 && this._inBios) {
          return bios[address];
        }
        return this._rom0.readByte(address);
      case 0x1000:
      case 0x2000:
      case 0x3000:
        return this._rom0.readByte(address);
      // ROM1
      case 0x4000:
      case 0x5000:
      case 0x6000:
      case 0x7000:
        return this._rom1.readByte(address & 0x1FFF);
      // VRAM
      case 0x8000:
      case 0x9000:
      // TODO: GPU VRAM
        return this._tempUntilGPUVram.readByte(address & 0x1FFF);
      // Cartridge RAM
      case 0xA000:
      case 0xB000:
        return this._eram.readByte(address & 0x1FFF);
      case 0xC000:
      case 0xD000:
        return this._wram.readByte(address & 0x1FFF);

      // Working RAM shadow, I/O and zero-page RAM
      case 0xE000:
      case 0xF000:
        if (address < 0xFE00) {
          return this._wram.readByte(address & 0x1FFF);
        } else if (address < 0xFF00) {
          // TODO: GPU OAM
          return this._tempOAM.readByte(address & 0xFF);
        } else if (address < 0xFF80) {
          // TODO: IO handling
          return this._tempIO.readByte(address & 0xFF);
        }
        return this._zram.readByte(address & 0x7F);
      default:
        throw new Error('Map not working');
    }
  }

  readWord(address) {
    return (this.readByte(address + 1) << 8) | this.readByte(address);
  }

  writeByte(address, value) {
    switch (address & 0xF000) {
      // BIOS / ROM0
      case 0x0000:
        if (address < 0x0100 && this._inBios) {
          throw new Error('Trying to write to bios');
        }
        this._rom0.writeByte(address, value);
        break;
      case 0x1000:
      case 0x2000:
      case 0x3000:
        this._rom0.writeByte(address, value);
        break;
      // ROM1
      case 0x4000:
      case 0x5000:
      case 0x6000:
      case 0x7000:
        this._rom1.writeByte(address & 0x1FFF, value);
        break;
      // VRAM
      case 0x8000:
      case 0x9000:
      // TODO: GPU VRAM
        this._tempUntilGPUVram.writeByte(address & 0x1FFF, value);
        break;
      // Cartridge RAM
      case 0xA000:
      case 0xB000:
        this._eram.writeByte(address & 0x1FFF, value);
        break;
      case 0xC000:
      case 0xD000:
        this._wram.writeByte(address & 0x1FFF, value);
        break;

      // Working RAM shadow, I/O and zero-page RAM
      case 0xE000:
      case 0xF000:
        if (address < 0xFE00) {
          this._wram.writeByte(address & 0x1FFF, value);
        } else if (address < 0xFF00) {
          // TODO: GPU OAM
          this._tempOAM.writeByte(address & 0xFF, value);
        } else if (address < 0xFF80) {
          // TODO: IO handling
          if (address === 0xFF50 && this._inBios) this.exitBios();
          this._tempIO.writeByte(address & 0xFF, value);
        } else {
          this._zram.writeByte(address & 0x7F, value);
        }
        break;
      default:
        throw new Error('Map not working');
    }
  }

  writeWord(address, value) {
    const mostSignificant = (value & 0xFF00) >>> 8;
    const leastSignificant = value & 0x00FF;
    this.writeByte(address + 1, mostSignificant);
    this.writeByte(address, leastSignificant);
  }

  getAll() {
    return new Uint8Array(this._memory._mem_buffer);
  }
}
