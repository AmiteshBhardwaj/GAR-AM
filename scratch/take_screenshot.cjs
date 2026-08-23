const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const outPath = path.resolve(__dirname, 'game_verify.png');

console.log('Capturing screenshot of http://localhost:5173 ...');

const cmd = `"${chromePath}" --headless=new --hide-scrollbars --window-size=1280,720 --screenshot="${outPath}" http://localhost:5173`;

try {
  execSync(cmd, { timeout: 10000, stdio: 'inherit' });
  console.log('Screenshot saved to:', outPath);
} catch (err) {
  console.error('Error running chrome:', err.message);
}
