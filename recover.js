const fs = require('fs');

function extractStrings(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  const buffer = fs.readFileSync(filePath);
  const minLength = 4;
  let currentString = '';
  const strings = new Set();
  
  for (let i = 0; i < buffer.length; i++) {
    const charCode = buffer[i];
    // Printable ASCII
    if (charCode >= 32 && charCode <= 126) {
      currentString += String.fromCharCode(charCode);
    } else {
      if (currentString.length >= minLength) {
        strings.add(currentString);
      }
      currentString = '';
    }
  }
  if (currentString.length >= minLength) {
    strings.add(currentString);
  }
  
  return Array.from(strings);
}

const dbStrings = extractStrings('server/db/construction.db') || [];
const walStrings = extractStrings('server/db/construction.db-wal') || [];

const allStrings = [...new Set([...dbStrings, ...walStrings])];
fs.writeFileSync('recovered_strings.txt', allStrings.join('\n'));
console.log(`Saved ${allStrings.length} unique strings to recovered_strings.txt`);
