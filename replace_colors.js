const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const replacements = [
    { from: '"primary": "#1e3fae"', to: '"primary": "#f97316"' },
    { from: /bg-blue-700/g, to: 'bg-orange-600' },
    { from: /bg-\[#1e40af\]/g, to: 'bg-orange-700' },
    { from: /shadow-blue-900\/20/g, to: 'shadow-orange-900/20' },
    { from: /bg-blue-500\/10/g, to: 'bg-orange-500/10' },
    { from: /text-blue-500/g, to: 'text-orange-500' },
    { from: /text-blue-400/g, to: 'text-orange-400' },
    { from: /bg-blue-500\/20/g, to: 'bg-orange-500/20' },
    { from: /bg-blue-100/g, to: 'bg-orange-100' },
    { from: /to-blue-700/g, to: 'to-orange-600' },
    { from: /from-blue-700/g, to: 'from-orange-600' }
];

let changedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    for (const rep of replacements) {
        if (typeof rep.from === 'string') {
            content = content.split(rep.from).join(rep.to);
        } else {
            content = content.replace(rep.from, rep.to);
        }
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        changedCount++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Finished updating ${changedCount} files.`);
