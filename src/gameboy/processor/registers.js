
class Registers {
  constructor() {
    this.a = 0x00;
    this.b = 0x00;
    this.c = 0x00;
    this.d = 0x00;
    this.e = 0x00;
    this.h = 0x00;
    this.l = 0x00;
    this.flags = 0x0000;
    this.stackPointer = 0x0000;
    this.programCounter =0x0000;
  }
}

export default Registers;
