import { Registers } from '../../src/gameboy/processor';
import { MMU } from '../../src/gameboy/memory';

const getEmptyState = () => ({ reg: new Registers(), mmu: new MMU(), interupt: {} });

export default getEmptyState;
