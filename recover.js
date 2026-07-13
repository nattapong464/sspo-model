const fs = require('fs');
const readline = require('readline');

async function processTranscript() {
  const logFile = 'C:/Users/User/.gemini/antigravity/brain/cccc8ebc-5a2c-4c5c-9f88-8852ee46fb17/.system_generated/logs/transcript_full.jsonl';
  
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let appJsxLines = {};
  let dataJsCode = null;
  let firebaseJsCode = null;

  for await (const line of rl) {
    try {
      const step = JSON.parse(line);
      
      // Extract data.js and firebase.js from write_to_file args
      if (step.tool_calls) {
        for (const call of step.tool_calls) {
          if (call.name === 'write_to_file') {
            const args = call.args;
            if (args.TargetFile && args.TargetFile.endsWith('data.js')) {
              dataJsCode = args.CodeContent;
            }
            if (args.TargetFile && args.TargetFile.endsWith('firebase.js')) {
              firebaseJsCode = args.CodeContent;
            }
          }
        }
      }
      
      // Extract App.jsx lines from view_file output
      if (step.type === 'TOOL_RESPONSE' && step.content) {
        if (step.content.includes('File Path: `file:///C:/Users/User/Documents/antigravity/optimistic-hubble/src/App.jsx`')) {
          // Parse lines like "1: import React from 'react';"
          const lines = step.content.split('\n');
          for (const l of lines) {
            const match = l.match(/^(\d+): (.*)$/);
            if (match) {
              const num = parseInt(match[1]);
              appJsxLines[num] = match[2];
            }
          }
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  fs.writeFileSync('C:/Users/User/Documents/antigravity/optimistic-hubble/recovered_data.js', dataJsCode || '');
  fs.writeFileSync('C:/Users/User/Documents/antigravity/optimistic-hubble/recovered_firebase.js', firebaseJsCode || '');
  
  const maxLine = Math.max(...Object.keys(appJsxLines).map(Number));
  let reconstructedApp = '';
  for (let i = 1; i <= maxLine; i++) {
    reconstructedApp += (appJsxLines[i] !== undefined ? appJsxLines[i] : `// MISSING LINE ${i}`) + '\n';
  }
  fs.writeFileSync('C:/Users/User/Documents/antigravity/optimistic-hubble/recovered_App.jsx', reconstructedApp);
  console.log('Recovery attempt finished. Max line in App.jsx:', maxLine);
  console.log('Missing lines in App.jsx:', Array.from({length: maxLine}, (_, i) => i + 1).filter(i => !appJsxLines[i]).length);
}

processTranscript();
