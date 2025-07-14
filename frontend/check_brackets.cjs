const fs = require('fs');

const content = fs.readFileSync('src/components/Worksheets.jsx', 'utf8');
const lines = content.split('\n');

let divOpen = 0;
let parens = 0;
let braces = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Count div tags
  const openDivs = (line.match(/<div[^>]*>/g) || []).length;
  const closeDivs = (line.match(/<\/div>/g) || []).length;
  divOpen += openDivs - closeDivs;
  
  // Count other brackets
  for (let char of line) {
    if (char === '(') parens++;
    if (char === ')') parens--;
    if (char === '{') braces++;
    if (char === '}') braces--;
  }
  
  // Report issues
  if (i >= 2195 && i <= 2205) {
    console.log(`Line ${i+1}: divs=${divOpen}, parens=${parens}, braces=${braces} | ${line.trim()}`);
  }
  
  if (divOpen < 0) {
    console.log(`ERROR: Extra closing div at line ${i+1}: ${line.trim()}`);
  }
}

console.log(`Final counts: divs=${divOpen}, parens=${parens}, braces=${braces}`);