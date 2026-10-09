const fs = require('node:fs');
const path = require('node:path');

const source = path.join(__dirname, '..', 'src', 'db', 'migrations');
const destination = path.join(__dirname, '..', 'dist', 'db', 'migrations');

fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });

console.log('SQL migrations copied to dist/db/migrations');
