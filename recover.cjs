const fs = require('fs');
const readline = require('readline');

async function extractApp() {
  const logFile = 'C:/Users/User/.gemini/antigravity/brain/cccc8ebc-5a2c-4c5c-9f88-8852ee46fb17/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let appJsxLines = {};
  
  for await (const line of rl) {
    try {
      const step = JSON.parse(line);
      const text = JSON.stringify(step);
      if (text.includes('App.jsx')) {
        // Try to match lines "1: import React" etc from ANY string in the step
        const strLines = text.split('\\n'); // in json, newlines are \n
        for (const l of strLines) {
          const match = l.match(/^(\d+): (.*)$/);
          if (match) {
            const num = parseInt(match[1]);
            appJsxLines[num] = match[2];
          }
        }
      }
    } catch (e) {}
  }
  
  const maxLine = Math.max(...Object.keys(appJsxLines).map(Number));
  if (maxLine > 0) {
    let reconstructedApp = '';
    for (let i = 1; i <= maxLine; i++) {
      reconstructedApp += (appJsxLines[i] !== undefined ? appJsxLines[i] : `// MISSING LINE ${i}`) + '\n';
    }
    fs.writeFileSync('C:/Users/User/Documents/antigravity/optimistic-hubble/recovered_App.jsx', reconstructedApp);
    console.log('Recovery attempt finished. Max line in App.jsx:', maxLine);
    console.log('Missing lines in App.jsx:', Array.from({length: maxLine}, (_, i) => i + 1).filter(i => !appJsxLines[i]).length);
  } else {
    console.log("No lines found.");
  }
}
extractApp();
