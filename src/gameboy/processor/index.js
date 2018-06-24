import { load8, load16, alu8, alu16, other } from './instructions';

const Z80 = {
  load8,
  load16,
  alu8,
  alu16,
  other,
};

export { Z80 };
export { Registers, RegMap } from './registers';
export { default as opcodes } from './opcodes-map';
export { default as CPU } from './core';
export { default as CheckFlagFor } from './flag-check';
