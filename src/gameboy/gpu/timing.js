import Util from '../util';
/* eslint no-bitwise: 0 */

const ticksBackgroundLine = 172;
const ticksSpriteLine = 80;
const ticksHBlank = 204;
const ticksVBlank = 456;

const numlines = 144;
const numVertLines = 10;

const Mode = {
  hblank: 0, vblank: 1, background: 2, sprite: 3,
};

class RenderTiming {
  constructor(interrupts) {
    this.inter = interrupts;
    this.reset();
  }

  reset() {
    this._modeClock = 0;
    this._line = 0;
    this._mode = RenderTiming.Mode.sprite;
    this.state = { shouldScanline: false, lastHblank: false };
    this.enteredOamMode = false;
    this.enteredVblankMode = false;
    this.enteredHblankMode = false;
    this.lcdStat = {};
    this.lyc = 0;
  }

  EnableOrDisableStatInterrupts(value) {
    const isLyc = Util.getBit(value, 6) === 1;
    const isOam = Util.getBit(value, 5) === 1;
    const isVblank = Util.getBit(value, 4) === 1;
    const isHblank = Util.getBit(value, 3) === 1;
    this.lcdStat = {
      lyc: isLyc, oam: isOam, vblank: isVblank, hblank: isHblank,
    };
  }

  getStat() {
    let currentStat = (this._line === this.lyc ? 4 : 0) | this._mode;
    currentStat |= this.lcdStat.hblank << 3;
    currentStat |= this.lcdStat.vblank << 4;
    currentStat |= this.lcdStat.oam << 5;
    currentStat |= this.lcdStat.lyc << 6;
    currentStat |= 0b10000000;
    return currentStat;
  }

  getMode() {
    return this._mode;
  }

  getLine() {
    return this._line & 0xFF;
  }

  resetLine() {
    this._line = 0;
  }
  // simple state machine that based on tick switches between hblank, vblank and line(s) states.
  step(tick) {
    this._modeClock += tick;
    if (this._mode === Mode.hblank) this._visitHblankState();
    else if (this._mode === Mode.sprite) this._visitSpriteLineState();
    else if (this._mode === Mode.background) this._visitBackgroundLineState();
    else if (this._mode === Mode.vblank) this._visitVblankState();
    else { throw new Error('Not a a valid state'); }

    if (this._line === this.lyc && this.inter) this.inter.triggerStat();
    return this._getStateAndReset();
  }

  _getStateAndReset() {
    const result = Object.assign({}, this.state);
    this.state.shouldScanline = false;
    this.state.shouldDisplay = false;
    return result;
  }

  _visitHblankState() {
    if (this.enteredHblankMode) {
      if (this.inter && this.lcdStat.hblank) this.inter.triggerStat();
      this.enteredHblankMode = false;
    }

    if (this._modeClock >= ticksHBlank) {
      this._modeClock = 0;
      this._mode = Mode.sprite;

      this._line += 1;

      if (this._line === numlines - 1) {
        this._mode = Mode.vblank;
        this.enteredVblankMode = true;
        this.state.shouldDisplay = true;
      }
    }
  }

  _visitVblankState() {
    if (this.enteredVblankMode) {
      if (this.inter) this.inter.triggerVblank();
      if (this.inter && this.lcdStat.vblank) this.inter.triggerStat();
      this.enteredVblankMode = false;
    }

    if (this._modeClock >= ticksVBlank) {
      this._modeClock = 0;
      this._mode = Mode.vblank;
      this._line += 1;

      if (this._line >= numlines + numVertLines) {
        this._mode = Mode.sprite;
        this.enteredOamMode = true;
        this._line = 0;
      } else {
        // TODO: perform last 10 vert lines here.
      }
    }
  }

  _visitSpriteLineState() {
    if (this.enteredOamMode) {
      if (this.inter && this.lcdStat.oam) this.inter.triggerStat();
      this.enteredOamMode = false;
    }
    if (this._modeClock >= ticksSpriteLine) {
      this._modeClock = 0;
      this._mode = Mode.background;
    }
  }

  _visitBackgroundLineState() {
    if (this._modeClock >= ticksBackgroundLine) {
      this._modeClock = 0;
      this._mode = Mode.hblank;
      this.enteredHblankMode = true;
      this.state.shouldScanline = true;
    }
  }
}

RenderTiming.Mode = Mode;

export default RenderTiming;
