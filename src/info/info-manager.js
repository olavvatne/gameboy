/* eslint no-bitwise: 0 */

const getHex = op => `0x${(op & 0x00FF).toString(16)}`;

export default class OpcodeInfoManager {
  constructor(opcodes) {
    // TODO: if not supplied. Load with javascript.
    this._opcodes = JSON.parse(opcodes);
  }

  getDescription(op) {
    const opInfo = this.findInfo(op);
    if (opInfo === undefined) {
      return 'Not found';
    }
    let text = `${getHex(op)}: ${opInfo.mnemonic}`;
    if (opInfo.operand1) text += ` - ${opInfo.operand1}`;
    if (opInfo.operand2) text += ` ${opInfo.operand2}`;
    return text;
  }

  findInfo(op) {
    if (op === null || op === undefined) return {};
    if ((op >>> 8) === 0xCB) {
      const cbKey = getHex(op & 0x00FF);
      return this._opcodes.cbprefixed[cbKey];
    }
    const key = getHex(op);
    return this._opcodes.unprefixed[key];
  }
}
