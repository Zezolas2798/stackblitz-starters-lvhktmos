const fs = require('fs');

const pageFile = 'c:\\Users\\julia\\Downloads\\stackblitz-starters-lvhktmos-main\\app\\qualidade\\planilhas\\[id]\\page.tsx';
const patchFile = 'c:\\Users\\julia\\Downloads\\stackblitz-starters-lvhktmos-main\\scripts\\patch-tables.txt';

let content = fs.readFileSync(pageFile, 'utf8');
const patch = fs.readFileSync(patchFile, 'utf8');

const anchor = "            case 'FILE':";
const replacement = patch + "\n" + anchor;

content = content.replace(anchor, replacement);
fs.writeFileSync(pageFile, content);
console.log('Patched page.tsx successfully');
