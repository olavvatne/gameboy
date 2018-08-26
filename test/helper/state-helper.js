import { Registers } from '../../src/gameboy/processor';
import { Memory } from '../../src/gameboy/memory';

const getEmptyState = () => ({ reg: new Registers(), mmu: new Memory(), interupt: {} });

export default getEmptyState;
