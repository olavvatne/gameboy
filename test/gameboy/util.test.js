import { assert } from 'chai';
import { it } from 'mocha';
import Util from '../../src/gameboy/util';

describe('Util', () => {
  describe('getBit tests', () => {
    it('get correct bit from byte', () => {
      const byte = 0b01100111;
      const bitIndices = [7, 6, 5, 4, 3, 2, 1, 0];
      const res = bitIndices.map(idx => Util.getBit(byte, idx));
      assert.deepEqual(res, [0, 1, 1, 0, 0, 1, 1, 1]);
    });

    it('retrieves bits where msb is the leftmost', () => {
      const byte = 0b10000000;
      const msb = Util.getBit(byte, 7);
      const lsb = Util.getBit(byte, 0);
      assert.equal(msb, 1);
      assert.equal(lsb, 0);
    });
  });


  describe('convertSignedByte tests', () => {
    it('converts positive signed byte to number', () => {
      const byte = 0b01111111;
      const val = Util.convertSignedByte(byte);
      assert.equal(val, 127);
    });

    it('converts negative signed byte to number', () => {
      const byte = 0b11001000;
      const val = Util.convertSignedByte(byte);
      assert.equal(val, -56);
    });
  });


  describe('twoComplementByte tests', () => {
    it('can convert a number to two compl. byte', () => {
      const val = 1;
      const byte = Util.twoComplementByte(val);
      assert.equal(byte, Util.convertSignedByte(-1));
    });

    it('can convert another number to two compl. byte', () => {
      const val = 120;
      const byte = Util.twoComplementByte(val);
      assert.equal(byte, Util.convertSignedByte(-120));
    });
  });
});
