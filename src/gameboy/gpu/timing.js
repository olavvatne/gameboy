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
    this.stat = {};
    this.lyc = 0;
  }

  setStatInterrupts(isLyc, isOam, isVblank, isHblank) {
    this.stat = {
      lyc: isLyc, oam: isOam, vblank: isVblank, hblank: isHblank,
    };
  }

  getStat() {
    return (this._line === this.lyc ? 4 : 0) | this._mode;
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
      if (this.inter && this.stat.hblank) this.inter.triggerStat();
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
      if (this.inter && this.stat.vblank) this.inter.triggerStat();
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
      if (this.inter && this.stat.oam) this.inter.triggerStat();
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
