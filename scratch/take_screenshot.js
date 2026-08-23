const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const outPath = path.resolve(__dirname, 'game_verify.png');

console.log('Capturing screenshot of http://localhost:5173 ...');

// Chrome CLI headless screenshot command with window size and virtual time budget
const cmd = `"${chromePath}" --headless --disable-gpu=false --use-gl=angle --enable-webgl --window-size=1280,720 --screenshot="${outPath}" --virtual-time-budget=5000 http://localhost:5173`;

try {
  execSync(cmd, { timeout: 15000, stdio: 'inherit' });
  console.log('Screenshot saved to:', outPath);
} catch (err) {
  console.error('Error running chrome:', err.message);
}
