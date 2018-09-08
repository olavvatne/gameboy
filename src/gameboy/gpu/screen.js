export default class Screen {
  constructor(canvas) {
    this._canvas = canvas;
    this._data = null;
    if (this._canvas) {
      this._data = this._canvas.createImageData(160, 144);
    } else {
      this._data = {
        width: 160,
        height: 144,
        data: new Array(160 * 144 * 4).fill(255),
      };
    }
  }
  setPixel(y, x, pixel) {
    const pos = (y * this._data.width) + (x * 4);
    const [r, g, b, a] = pixel;
    this._data[pos] = r;
    this._data[pos + 1] = g;
    this._data[pos + 2] = b;
    this._data[pos + 3] = a;
  }

  displayImage() {
    if (!this._canvas) return;
    this._canvas.putImageData(this._data, 0, 0);
  }
}
