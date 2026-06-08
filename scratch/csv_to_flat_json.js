const fs = require('fs');
const path = require('path');

function parseCsvRow(row) {
  const result = [];
  let inQuotes = false;
  let currentVal = '';
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal);
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal);
  return result;
}

const csvPath = path.resolve(__dirname, '../src/constants/strings.csv');
const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split('\n');
const map = {};

lines.forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return; // ignore comments or empty lines
  const parts = parseCsvRow(trimmed);
  const key = parts[0]?.trim();
  const value = parts[1]?.trim() ?? '';
  
  if (key && key !== 'key') {
    // Replace literal '\n' string representations with actual newline characters
    map[key] = value.replace(/\\n/g, '\n');
  }
});

const outputPath = path.resolve(__dirname, '../src/constants/translations/en.json');
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(map, null, 2));
console.log(`[csvToFlatJson] successfully wrote ${Object.keys(map).length} keys into en.json`);
