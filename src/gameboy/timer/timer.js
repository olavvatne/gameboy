/* eslint no-bitwise: 0 */
/* eslint prefer-destructuring: 0 */

// 00: 4096Hz, 01: 262144Hz, 10: 65536Hz, 11: 16384Hz
const freq = [1024, 16, 64, 256];

export default class Timer {
  constructor(interrupts) {
    this.interrupts = interrupts;
    this.div = 0; // timer
    this.tima = 0; // timer
    this.tma = 0; // tima timer starts at modulo at overflow
    this.tac = 0; // controls tima timer. bit 0 and 1 - speed, bit 2 - enabled
    this.divCounter = 0;
    this.timaCounter = 0;
    this.timaEnabled = false;
    this.timaSpeed = freq[0];
  }

  // Gameboy cpu 4194304Hz. Cpu can produce this many  cycles per second
  // Div timer counts at 16384Hz
  // 4194304Hz / 16384hz = 256 cpu cycles required before incrementing div register
  increment(cycles) {
    const divThreshold = 256;
    this.divCounter += cycles;
    while (this.divCounter >= divThreshold) {
      this.divCounter -= divThreshold;
      this.div = (this.div + 1) & 0xFF;
    }

    // this.div += this.divCounter >> 8; // increment after counter reaches 256
    // this.divCounter &= 0xFF;
    // this.div &= 0xFF; // After div timer has overflown it start at zero again.

    if (!this.timaEnabled) return;

    this.timaCounter += cycles;
    while (this.timaCounter >= this.timaSpeed) {
      this.timaCounter -= this.timaSpeed;
      this.tima += 1;

      if (this.tima > 0xFF) {
        this.tima = this.tma & 0xFF;
        this.interrupts.triggerTimer();
      }
    }
  }

  setTac(tac) {
    this.tac = tac;
    this.timaEnabled = !!(tac & 0b00000100);
    this.timaSpeed = freq[tac & 3];
  }
}
