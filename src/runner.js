/* global document window Gameboy FileReader */
const logo = [
  0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
  0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e, 0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
  0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc, 0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
];

const checksum = [
  0x54, 0x45, 0x54, 0x52, 0x49, 0x53, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x01, 0x0A,
];

const putLogoInMem = (gameboy) => {
  for (let i = 0; i < logo.length; i += 1) {
    gameboy.memory.writeByte(0x104 + i, logo[i]);
  }
};

const putChecksumInMem = (gameboy) => {
  for (let i = 0; i < checksum.length; i += 1) {
    gameboy.memory.writeByte(0x134 + i, checksum[i]);
  }
};

let gameboy = null;
const initGameboy = () => {
  const c = document.getElementById('screen');
  gameboy = new Gameboy(c.getContext('2d'));
  putLogoInMem(gameboy);
  putChecksumInMem(gameboy);
};

const handleRomSelect = (evt) => {
  if (evt.target.files.length < 1) return;
  const localRom = evt.target.files[0];
  const rd = new FileReader();
  rd.onload = () => {
    const data = rd.result;
    gameboy.loadRom(data);
  };
  rd.readAsBinaryString(localRom);
};

window.onload = () => {
  initGameboy();
  document.getElementById('start').onclick = () => gameboy.start();
  document.getElementById('pause').onclick = () => gameboy.pause();
  document.getElementById('reset').onclick = () => gameboy.reset();
  document.getElementById('load').addEventListener('change', handleRomSelect, false);
};
