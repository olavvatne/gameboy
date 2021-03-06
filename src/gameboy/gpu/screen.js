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

  getPixel(y, x) {
    const pos = (y * this._image.width * 4) + (x * 4);
    const r = this._image.data[pos];
    const g = this._image.data[pos + 1];
    const b = this._image.data[pos + 2];
    const a = this._image.data[pos + 3];
    return [r, g, b, a];
  }

  displayImage() {
    if (!this._canvas) return;
    this._canvas.putImageData(this._image, 0, 0);
  }

  reset() {
    if (this._canvas) {
      for (let i = 0; i < this._image.data.length; i += 1) {
        this._image.data[i] = 0;
      }
    } else {
      this._image.data = new Array(160 * 144 * 4).fill(255);
    }

    this.displayImage();
  }
}
