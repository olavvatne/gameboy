import { Registers } from '../../src/gameboy/processor/index.js';
import { MMU } from '../../src/gameboy/memory/index.js';

const getEmptyState = () => {
  const regs = new Registers();
  return {
    mmu: new MMU(),
    interrupt: { enabled: false, anyTriggered: () => {} },
    map: regs.map,
    actions: { stop: false },
  };
};

export default getEmptyState;
