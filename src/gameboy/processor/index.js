import { 
  load8,
  load16,
  alu8,
  alu16,
  misc,
  rotate,
  shift,
  bit,
  jump,
  subroutine
} from './instructions/index.js';

const Z80 = {
  load8,
  load16,
  alu8,
  alu16,
  misc,
  rotate,
  shift,
  bit,
  jump,
  subroutine,
};

export { Z80 };
export { Registers, NameMap } from './registers.js';
export { default as opcodes } from './opcodes-map.js';
export { default as CPU } from './core.js';
export { default as CheckFlagFor } from './flag-check.js';
export { default as Interrupts } from './interrupts.js';
