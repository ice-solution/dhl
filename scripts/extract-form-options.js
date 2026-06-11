const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../form.html'), 'utf8');

function decode(s) {
  return s
    .replace(/&#039;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .trim();
}

function parseOptions(inner) {
  const options = [];

  const beforeOptgroup = inner.split(/<optgroup/i)[0];
  const optRegex = /<option[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/gi;
  let om;
  while ((om = optRegex.exec(beforeOptgroup)) !== null) {
    options.push({ value: decode(om[1]), label: decode(om[2]) });
  }

  const optgroupRegex = /<optgroup[^>]*label="([^"]+)"[^>]*>([\s\S]*?)<\/optgroup>/gi;
  let og;
  while ((og = optgroupRegex.exec(inner)) !== null) {
    const group = og[1];
    const groupOptRegex = /<option[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/gi;
    while ((om = groupOptRegex.exec(og[2])) !== null) {
      options.push({ value: decode(om[1]), label: decode(om[2]), group });
    }
  }

  if (!inner.includes('<optgroup')) {
    options.length = 0;
    while ((om = optRegex.exec(inner)) !== null) {
      options.push({ value: decode(om[1]), label: decode(om[2]) });
    }
  }

  return options;
}

const result = {};
const selectRegex = /<select[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/gi;
let m;
while ((m = selectRegex.exec(html)) !== null) {
  result[m[1]] = parseOptions(m[2]);
}

const outPath = path.join(__dirname, '../data/form-options.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`Extracted ${Object.keys(result).length} selects to ${outPath}`);
