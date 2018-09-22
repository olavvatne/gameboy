/* eslint no-bitwise: 0 */
const numRegs = 8;
export const RegMap = {
  a: 0,
  f: 1,
  b: 2,
  c: 3,
  d: 4,
  e: 5,
  h: 6,
  l: 7,
  af: 8,
  bc: 9,
  de: 10,
  hl: 11,
  sp: 12,
};

export const NameMap = {
  a: 'a',
  f: 'f',
  b: 'b',
  c: 'c',
  d: 'd',
  e: 'e',
  h: 'h',
  l: 'l',
  af: 'af',
  bc: 'bc',
  de: 'de',
  hl: 'hl',
  sp: 'sp',
};

export class Registers {
  constructor() {
    this._initGeneralPurposeRegisters();
    this._sp = 0xFFFE; // Default on start up
    this._pc = 0x00;
    this.map = this._createAccessorMap();
  }

  _createAccessorMap() {
    return {
      a: val => this._reg8(RegMap.a, val),
      b: val => this._reg8(RegMap.b, val),
      c: val => this._reg8(RegMap.c, val),
      d: val => this._reg8(RegMap.d, val),
      e: val => this._reg8(RegMap.e, val),
      f: val => this._reg8(RegMap.f, val),
      h: val => this._reg8(RegMap.h, val),
      l: val => this._reg8(RegMap.l, val),
      af: val => this._reg16(RegMap.af, val),
      bc: val => this._reg16(RegMap.bc, val),
      de: val => this._reg16(RegMap.de, val),
      hl: val => this._reg16(RegMap.hl, val),
      sp: val => this.sp(val),
      pc: val => this.pc(val),
    };
  }

  _initGeneralPurposeRegisters() {
    this._gpr_buffer = new ArrayBuffer(numRegs);
    this._gpr = new DataView(this._gpr_buffer);
  }

  _reg8(num, value = null) {
    if (value !== null) {
      this._gpr.setUint8(num, value);
    }

    return this._gpr.getUint8(num);
  }

  _reg16(num, value = null) {
    const regOffset = (num - RegMap.af) * 2;
    if (value !== null) {
      this._gpr.setUint16(regOffset, value, false);
    }

    return this._gpr.getUint16(regOffset, false);
  }

  pc(value = null) {
    if (value !== null) {
      this._pc = value & 0xFFFF;
    }
    return this._pc;
  }

  sp(value = null) {
    if (value !== null) {
      this._sp = value & 0xFFFF;
    }
    return this._sp;
  }

  // getState() {
  //   const state = {};
  //   Object.entries(RegMap).forEach(([name, addr]) => {
  //     state[name] = this.reg(addr);
  //   });
  //   state.pc = this.pc();
  //   state.f = this.flags();
  //   return state;
  // }
}
