const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const replacements = [
    { from: '"primary": "#f97316"', to: '"primary": "#1e3fae"' },
    { from: /bg-orange-600/g, to: 'bg-blue-700' },
    { from: /bg-orange-700/g, to: 'bg-[#1e40af]' },
    { from: /shadow-orange-900\/20/g, to: 'shadow-blue-900/20' },
    { from: /bg-orange-500\/10/g, to: 'bg-blue-500/10' },
    { from: /text-orange-500/g, to: 'text-blue-500' },
    { from: /text-orange-400/g, to: 'text-blue-400' },
    { from: /bg-orange-500\/20/g, to: 'bg-blue-500/20' },
    { from: /bg-orange-100/g, to: 'bg-blue-100' },
    { from: /to-orange-600/g, to: 'to-blue-700' },
    { from: /from-orange-600/g, to: 'from-blue-700' }
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
        console.log(`Reverted ${file}`);
    }
}

console.log(`Finished reverting ${changedCount} files.`);
