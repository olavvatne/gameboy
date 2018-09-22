import bios from './bios';
import Memory from './memory';
import Interrupts from '../input/interrupts';
/* eslint no-bitwise: 0 */

export default class MMU {
  constructor(
    vram = new Memory(2 ** 13), oam = new Memory(2 ** 8),
    io = new Memory(2 ** 7), interrupts = new Interrupts(),
  ) {
    this._rom0 = new Memory(2 ** 14);
    this._rom1 = new Memory(2 ** 14);
    this._vram = vram;
    this.interrupts = interrupts;
    this._eram = new Memory(2 ** 13);
    this._wram = new Memory(2 ** 13);
    this._zram = new Memory(2 ** 7);
    this.io = io;
    this._cartType = 0;
    this._oam = oam;
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
        return this._vram.readByte(address & 0x1FFF);
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
          return this._oam.readByte(address & 0xFF);
        } else if (address < 0xFF80) {
          if (address === 0xFF0F) return this.interrupts._if;
          return this.io.readByte(address & 0xFF);
        } else if (address === 0xFFFF) {
          return this.interrupts._ie;
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
        this._vram.writeByte(address & 0x1FFF, value);
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
          this._oam.writeByte(address & 0xFF, value);
        } else if (address < 0xFF80) {
          if (address === 0xFF50 && this._inBios) this.exitBios();
          if (address === 0xFF0F) this.interrupts._if = value;
          this.io.writeByte(address & 0xFF, value);
        } else if (address === 0xFFFF) {
          this.interrupts._ie = value;
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

  load(data) {
    const prevInBios = this._inBios;
    this._inBios = false;
    const maxIndex = Math.min(data.length, 2 ** 15);
    for (let i = 0; i < maxIndex; i += 1) {
      this.writeByte(i, data.charCodeAt(i));
    }
    this._inBios = prevInBios;
    this._cartType = this.readByte(0x0147);
  }

  reset() {
    this._inBios = true;
  }
}
