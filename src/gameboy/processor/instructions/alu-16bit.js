import { CheckFlagFor } from '../index.js';
import Util from './../../util.js';
/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

export default {
  addRegHLReg: ({ map }, regX) => {
    const hl = map.hl();
    const x = regX();
    const val = hl + x;
    map.hl(val);

    const flag = new CheckFlagFor(map.f()).notSubtraction().setH16(val, hl, x).carry16(val).get();
    map.f(flag);

    return 8;
  },

  inc: (_, regX) => {
    regX(regX() + 1);
    return 8;
  },

  dec: (_, regX) => {
    regX(regX() - 1);
    return 8;
  },

  addRegSPImmediate: ({ mmu, map }) => {
    const pc = map.pc();
    const sp = map.sp();
    const immediateSigned = Util.convertSignedByte(mmu.readByte(pc));
    map.pc(pc + 1);
    const val = sp + immediateSigned;
    map.sp(val & 0xFFFF);

    const isC = (sp & 0xFF) + (immediateSigned & 0xFF) > 0xFF;
    const flag = new CheckFlagFor().setC(isC).setH(val, sp, immediateSigned).get();
    map.f(flag);
    return 16;
  },
};
