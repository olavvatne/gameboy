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

export class Registers {
  constructor() {
    this._initGeneralPurposeRegisters();
    this._initProgramCounter();
    this._initStackPointer();
  }

  _initGeneralPurposeRegisters() {
    this._gpr_buffer = new ArrayBuffer(numRegs);
    this._gpr = new DataView(this._gpr_buffer);
  }

  _initProgramCounter() {
    this._pc = 0x0100; // Default on start up - 3.2.3 GBCPUman
  }

  _initStackPointer() {
    this._sp = 0xFFFE; // Default on start up
  }

  static is16BitAccessAddress(num) {
    return num > RegMap.l;
  }

  reg(num, val = null) {
    if (num < 0 || num > RegMap.sp) {
      throw Error('Trying to access unknown register');
    }
    if (num === RegMap.sp) {
      return this.sp(val);
    }
    if (Registers.is16BitAccessAddress(num)) {
      return this._reg16(num, val);
    }

    return this._reg8(num, val);
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
      this._gpr.setUint16(regOffset, value, true);
    }

    return this._gpr.getUint16(regOffset, true);
  }

  pc(value = null) {
    if (value !== null) {
      this._pc = value;
    }
    return this._pc;
  }

  sp(value = null) {
    if (value !== null) {
      this._sp = value;
    }
    return this._sp;
  }

  flags() {
    return this.reg(RegMap.f);
  }

  getState() {
    const state = {};
    Object.entries(RegMap).forEach(([name, addr]) => {
      state[name] = this.reg(addr);
    });
    return state;
  }
}
