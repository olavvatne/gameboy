import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { VideoMemory, Renderer, FrameBuffer, Screen } from '../../src/gameboy/gpu/';
import Util from '../../src/gameboy/util';

describe('GPU', () => {
  let renderer = null;
  let mem = null;
  let screen = null;
  let buffer = null;
  let registers = null;
  let palette = null;
  beforeEach(() => {
    buffer = new FrameBuffer();
    screen = new Screen();
    registers = {
      x: 0, y: 0, tileset: 0, tilemap: 0,
    };
    palette = [
      [230, 230, 230, 230],
      [192, 192, 192, 192],
      [96, 96, 96, 96],
      [10, 10, 10, 10],
    ];
    mem = new VideoMemory(buffer);
    renderer = new Renderer(buffer, screen, mem, registers, palette);
  });

  describe('Renderer tests', () => {
    it('renders line where it hit tile in set 0 and map 0 with scroll y set', () => {
      registers.y = 16;
      const tileNum = 127; // last tile in tileset 0
      const tileset0Offset = 256;
      const tilemapAddr = 0x1800 + (32 * (registers.y / 8));
      mem.writeByte(tilemapAddr, tileNum);
      buffer.tiles[tileset0Offset + tileNum][0] = [0, 2, 3, 1, 0, 3, 1, 3];

      renderer.renderScanline(0);

      const pixelo = screen.getPixel(0, 0);
      const pixel1 = screen.getPixel(0, 1);
      const pixel7 = screen.getPixel(0, 7);
      assert.includeMembers(pixelo, [230]);
      assert.includeMembers(pixel1, [96]);
      assert.includeMembers(pixel7, [10]);
    });

    it('renders first line with tile with negative num', () => {
      registers.y = 16;
      const tileNum = -128; // last tile in tileset 0
      const tileset0Offset = 256;
      const tilemapAddr = 0x1800 + (32 * (registers.y / 8));
      mem.writeByte(tilemapAddr, Util.twoComplementByte(128));
      buffer.tiles[tileset0Offset + tileNum][1] = [1, 2, 3, 1, 0, 3, 1, 2];

      renderer.renderScanline(1);

      const pixelo = screen.getPixel(1, 0);
      const pixel7 = screen.getPixel(1, 7);
      assert.includeMembers(pixelo, [192]);
      assert.includeMembers(pixel7, [96]);
    });

    it('renders line 143 and pixel at the end of the line correctly', () => {
      registers.y = 8;
      registers.tileset = 1;
      const line = 143;
      const tileNum = 10; // last tile in tileset 0
      let tilemapAddr = 0x1800 + (32 * Math.floor((registers.y + line) / 8));
      tilemapAddr += Math.floor(160 / 8) - 1; // Find last tile in row
      mem.writeByte(tilemapAddr, tileNum);
      buffer.tiles[tileNum][7] = [0, 2, 3, 1, 0, 3, 0, 2];

      renderer.renderScanline(line);

      const lastPixel = screen.getPixel(line, 159);
      const anotherPixel = screen.getPixel(line, 157);
      assert.includeMembers(lastPixel, [96]);
      assert.includeMembers(anotherPixel, [10]);
    });
  });
});
