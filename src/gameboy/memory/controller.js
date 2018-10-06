import bios from './bios';
import Memory from './memory';
import Interrupts from '../input/interrupts';
import OAM from '../gpu/object-attribute-memory';
import Cartridge from './cartrigde';
/* eslint no-bitwise: 0 */

export default class MMU {
  constructor(
    vram = new Memory(2 ** 13), oam = new OAM(),
    io = new Memory(2 ** 7), interrupts = new Interrupts(),
  ) {
    this._rom0 = new Uint8Array(2 ** 14);
    this._rom1 = new Uint8Array(2 ** 14);
    this._vram = vram;
    this.interrupts = interrupts;
    this._wram = new Memory(2 ** 13);
    this._zram = new Memory(2 ** 7);
    this.io = io;
    this.cartridge = new Cartridge();
    this._oam = oam;
    this._oam.setMemoryReader(this);
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
        return this.cartridge.rom[address];
      case 0x1000:
      case 0x2000:
      case 0x3000:
        return this.cartridge.rom[address];
      // ROM1
      case 0x4000:
      case 0x5000:
      case 0x6000:
      case 0x7000:
        return this.cartridge.rom[this.cartridge.romOffset + (address & 0x3FFF)];
      // VRAM
      case 0x8000:
      case 0x9000:
        return this._vram.readByte(address & 0x1FFF);
      // Cartridge/external RAM
      case 0xA000:
      case 0xB000:
        return this.cartridge.ram[this.cartridge.ramOffset + (address & 0x1FFF)];
      case 0xC000:
      case 0xD000:
        return this._wram.readByte(address & 0x1FFF);

      // Working RAM shadow, I/O and zero-page RAM
      case 0xE000:
      case 0xF000:
        if (address < 0xFE00) {
          return this._wram.readByte(address & 0x1FFF);
        } else if (address < 0xFF00) {
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
      // Read only, but can write certain values at certain addresses to configure cartrige rom/ram
      case 0x0000:
      case 0x1000:
        this.cartridge.enableExternal(value);
        break;
      case 0x2000:
      case 0x3000:
        this.cartridge.rom[address] = value;
        break;
      // ROM1
      case 0x4000:
      case 0x5000:
      case 0x6000:
      case 0x7000:
        this.cartridge.rom[this.cartridge.romOffset + (address & 0x3FFF)] = value;
        break;
      // VRAM
      case 0x8000:
      case 0x9000:
        this._vram.writeByte(address & 0x1FFF, value);
        break;
      // Cartridge RAM
      case 0xA000:
      case 0xB000:
        this.cartridge.ram[this.cartridge.ramOffset + (address & 0x1FFF)] = value;
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
          this._oam.writeByte(address & 0xFF, value);
        } else if (address < 0xFF80) {
          if (address === 0xFF50 && this._inBios) this.exitBios();
          else if (address === 0xFF46) {
            this._oam.startDmaTransfer(value);
          } else if (address === 0xFF0F) {
            this.interrupts._if = value;
          }
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
    this.cartridge.rom = new Uint8Array(data, 0, data.byteLength);
    this._inBios = prevInBios;
    this.cartridge.type = this.readByte(0x0147);
  }

  reset() {
    this._inBios = true;
    this.cartridge.reset();
  }
}
