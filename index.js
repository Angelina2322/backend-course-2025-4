const { program } = require('commander');
const fs = require('fs');

program
  .requiredOption('-i, --input <path>', 'Path to input JSON file')
  .parse(process.argv);

const options = program.opts();
console.log('Input file:', options.input);

try {
  const data = JSON.parse(fs.readFileSync(options.input, 'utf8'));
  console.log('Number of records:', data.length);
} catch (err) {
  console.error('Error reading JSON:', err.message);
}

