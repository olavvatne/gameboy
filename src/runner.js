/* global document window Gameboy FileReader */
let gameboy = null;
const initGameboy = () => {
  const c = document.getElementById('screen');
  gameboy = new Gameboy(c.getContext('2d'));
};

const handleRomSelect = (evt) => {
  // TODO: Only called once for some reason?
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
  document.addEventListener('keydown', e => gameboy.io.handleKeyDown(e));
  document.addEventListener('keyup', e => gameboy.io.handleKeyUp(e));
  document.getElementById('load').addEventListener('change', handleRomSelect, false);
};

