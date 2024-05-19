import { assert } from 'chai';
import { it, beforeEach, describe } from 'mocha';
import IORegister from '../../src/gameboy/io/io-register.js';
import { RenderTiming } from '../../src/gameboy/gpu/index.js';


describe('Misc', () => {
  let io = null;
  let gpu = null;
  let palette = null;
  const getKeyEvent = key => ({ key });

  beforeEach(() => {
    gpu = {
      registers: {},
      setPalette: (_, p) => { palette = p; },
      renderTiming: new RenderTiming(),
    };
    gpu.renderTiming._line = 2;
    io = new IORegister(gpu);
  });

  describe('IO register tests', () => {
    it('returns gpu register SCY if 0x42', () => {
      gpu.registers.y = 0x10;
      assert.equal(io.readByte(0x42), 0x10);
      io.writeByte(0x42, 0x11);
      assert.equal(io.readByte(0x42), 0x11);
    });

    it('returns gpu register SCX if 0x43', () => {
      gpu.registers.x = 0x11;
      assert.equal(io.readByte(0x43), 0x11);
      io.writeByte(0x43, 0x12);
      assert.equal(io.readByte(0x43), 0x12);
    });

    it('returns gpu LCDC Y vertical if 0x44', () => {
      assert.equal(io.readByte(0x44), 2);
      io.writeByte(0x44, 0x12);
      // resets line
      assert.equal(io.readByte(0x44), 0);
    });

    it('switches keycolumn writing to x00', () => {
      io.keyColumns[0] = [1, 1, 1, 1];
      io.keyColumns[1] = [0, 0, 0, 0];

      io.writeByte(0x00, 0b00100000);
      const keySecondColumn = io.readByte(0x00);

      io.writeByte(0x00, 0b00010000);
      const keyFirstColumn = io.readByte(0x00);

      assert.equal(keyFirstColumn, 0b00001111);
      assert.equal(keySecondColumn, 0);
    });

    it('calls to set palette of object and bg', () => {
      io.writeByte(0x47, 0x00);
      assert.equal(palette, 'bg');
      io.writeByte(0x48, 0x00);
      assert.equal(palette, 'obj0');
      io.writeByte(0x49, 0x00);
      assert.equal(palette, 'obj1');
    });

    it('sets LCDC controller with 0x40', () => {
      io.writeByte(0x40, 1);
      assert.equal(gpu.registers.bg, 1);
      io.writeByte(0x40, 2);
      assert.equal(gpu.registers.sprite, 1);
      io.writeByte(0x40, 4);
      assert.equal(gpu.registers.spriteHeight, 16);
      io.writeByte(0x40, 8);
      assert.equal(gpu.registers.tilemap, 1);
      io.writeByte(0x40, 16);
      assert.equal(gpu.registers.tileset, 1);
      io.writeByte(0x40, 64);
      assert.equal(gpu.registers.tilemapWindow, 1);
      io.writeByte(0x40, 128);
      assert.equal(gpu.registers.lcd, 1);
    });

    it('can get lcd status', () => {
      io.writeByte(0x41, 0b01001000); // oam and hblank enable
      io.writeByte(0x45, 2);
      const stat = io.readByte(0x41);
      assert.equal(stat, 0b11001110);
    });

    it('sets key column correctly from key down event', () => {
      const tests = [
        { key: 'Enter', col: [0], row: [0] },
        { key: 'Space', col: [0], row: [1] },
        { key: 'z', col: [0], row: [2] },
        { key: 'x', col: [0], row: [3] },
        { key: 'Down', col: [1], row: [0] },
        { key: 'Up', col: [1], row: [1] },
        { key: 'Left', col: [1], row: [2] },
        { key: 'Right', col: [1], row: [3] },
      ];

      tests.forEach((t) => {
        io.handleKeyDown(getKeyEvent(t.key));
        assert.equal(io.keyColumns[t.col][t.row], 0);
        io.handleKeyUp(getKeyEvent(t.key));
        assert.equal(io.keyColumns[t.col][t.row], 1);
      });
    });
  });
});
