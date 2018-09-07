const ticksBackgroundLine = 172;
const ticksSpriteLine = 80;
const ticksHBlank = 204;
const ticksVBlank = 456;

const numlines = 144;
const numVertLines = 10;

const Mode = {
  hblank: 0, sprite: 1, background: 2, vblank: 3,
};

class RenderTiming {
  constructor() {
    this._modeClock = 0;
    this._line = 0;
    this._mode = RenderTiming.Mode.sprite;
    this.state = { shouldScanline: false, lastHblank: false };
  }

  getMode() {
    return this._mode;
  }

  getLine() {
    return this._line;
  }

  // simple state machine that based on tick switches between hblank, vblank and line(s) states.
  step(tick) {
    this._modeClock += tick;
    if (this._mode === Mode.hblank) this._visitHblankState();
    else if (this._mode === Mode.sprite) this._visitSpriteLineState();
    else if (this._mode === Mode.background) this._visitBackgroundLineState();
    else if (this._mode === Mode.vblank) this._visitVblankState();
    else { throw new Error('Not a a valid state'); }
    return this._getStateAndReset();
  }

  _getStateAndReset() {
    const result = Object.assign({}, this.state);
    this.state.shouldScanline = false;
    this.state.lastHblank = false;
    return result;
  }

  _visitHblankState() {
    if (this._modeClock >= ticksHBlank) {
      this._modeClock = 0;
      this._mode = Mode.sprite;

      this._line += 1;

      if (this._line === numlines - 1) {
        this._mode = Mode.vblank;
        this.state.lastHblank = true;
      }
    }
  }

  _visitVblankState() {
    if (this._modeClock >= ticksVBlank) {
      this._modeClock = 0;
      this._mode = Mode.vblank;
      this._line += 1;

      if (this._line >= numlines + numVertLines) {
        this._mode = Mode.sprite;
        this._line = 0;
      } else {
        // TODO: perform last 10 vert lines here.
      }
    }
  }

  _visitSpriteLineState() {
    if (this._modeClock >= ticksSpriteLine) {
      this._modeClock = 0;
      this._mode = Mode.background;
    }
  }

  _visitBackgroundLineState() {
    if (this._modeClock >= ticksBackgroundLine) {
      this._modeClock = 0;
      this._mode = Mode.hblank;
      this.state.shouldScanline = true;
    }
  }
}

RenderTiming.Mode = Mode;

export default RenderTiming;
