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
if (!fs.existsSync(csvPath)) {
  console.error('strings.csv not found!');
  process.exit(1);
}

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split('\n');
const root = {};

lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const parts = parseCsvRow(trimmed);
  const key = parts[0]?.trim();
  let value = parts[1]?.trim() ?? '';
  
  if (!key || key === 'key') return;
  
  // Replace literal \n with actual newlines
  value = value.replace(/\\n/g, '\n');
  
  // Split key by dot to construct nested object
  const steps = key.split('.');
  let current = root;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const isLast = i === steps.length - 1;
    
    if (isLast) {
      if (current[step] !== undefined) {
        console.warn(`[Conflict] Key "${key}" already exists! Value:`, current[step]);
      }
      current[step] = value;
    } else {
      if (current[step] === undefined) {
        current[step] = {};
      } else if (typeof current[step] === 'string') {
        console.warn(`[Conflict] Structural clash at "${key}" at step "${step}". Parent key is already a string: "${current[step]}"`);
        // override parent with object to continue checking other keys
        current[step] = { _self: current[step] };
      }
      current = current[step];
    }
  }
});

const outputPath = path.resolve(__dirname, '../src/constants/translations/en.json');
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(root, null, 2));
console.log(`Successfully converted CSV to nested JSON at ${outputPath}`);
console.log(`Total root keys: ${Object.keys(root).length}`);
