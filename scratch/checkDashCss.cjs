const fs = require('fs');
const dash = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');
const css = fs.readFileSync('frontend/src/index.css', 'utf8');
const matches = [...dash.matchAll(/className=["'`]([^"'`]+)["'`]/g)];
const classes = [...new Set(matches.flatMap(m => m[1].split(/\s+/)))];
const missing = classes.filter(c => c && !c.includes('$') && !c.includes('{') && !css.includes('.' + c));
console.log('Total classes:', classes.length);
console.log('Missing classes in index.css:\n' + missing.join('\n'));
