export default class Screen {
  constructor(canvas) {
    this._canvas = canvas;
    this._image = null;
    if (this._canvas) {
      this._image = this._canvas.createImageData(160, 144);
    } else {
      this._image = {
        width: 160,
        height: 144,
        data: new Array(160 * 144 * 4).fill(255),
      };
    }
  }
  setPixel(y, x, pixel) {
    const pos = (y * this._image.width * 4) + (x * 4);
    const [r, g, b, a] = pixel;
    this._image.data[pos] = r;
    this._image.data[pos + 1] = g;
    this._image.data[pos + 2] = b;
    this._image.data[pos + 3] = a;
  }

  displayImage() {
    if (!this._canvas) return;
    this._canvas.putImageData(this._image, 0, 0);
  }
}
