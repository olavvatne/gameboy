import { Registers } from '../../src/gameboy/processor';
import { MMU } from '../../src/gameboy/memory';

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
