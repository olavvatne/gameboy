import { Registers } from '../../src/gameboy/processor';
import { MMU } from '../../src/gameboy/memory';

const getEmptyState = () => {
  const regs = new Registers();
  return {
    reg: regs, mmu: new MMU(), interrupt: {}, map: regs.map,
  };
};

export default getEmptyState;
