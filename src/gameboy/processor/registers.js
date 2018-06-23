const numRegs = 8;

export const Reg = {
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
};

export class Registers {
  constructor() {
    this._initGeneralPurposeRegisters();
    this._initProgramCounter();
    this._initStackPointer();
  }

  _initGeneralPurposeRegisters() {
    this._gpr_buffer = new ArrayBuffer(numRegs);
    this._gpr = new Uint8Array(this._gpr_buffer);
  }

  _initProgramCounter() {
    this._pc = 0x0000;
  }

  _initStackPointer() {
    this._sp = 0x0000;
  }

  static is16BitAccessAddress(num) {
    return num > Reg.l;
  }

  reg(num, val = null) {
    if (num < 0 || num > Reg.hl) {
      throw Error('Trying to access unknown register');
    }

    if (Registers.is16BitAccessAddress(num)) {
      return this._reg16(num, val);
    }

    return this._reg8(num, val);
  }

  _reg8(num, value = null) {
    if (value !== null) {
      this._gpr.set([value], num);
    }

    return this._gpr[num];
  }

  _reg16(num, value = null) {
    const regOffset = (num - Reg.af) * 2;
    const view = new DataView(this._gpr_buffer, regOffset, 2);
    if (value !== null) {
      view.setUint16(0, value, true);
    }

    return view.getUint16(0, true);
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
    return this.get(Reg.f);
  }
}
