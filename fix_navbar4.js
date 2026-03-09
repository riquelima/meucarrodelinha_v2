const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let changedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We locate ANY <nav> block and remove "active-scale" from it.
    let newContent = content.replace(/<nav[\s\S]*?<\/nav>/g, (match) => {
        return match.replace(/\bactive-scale\b/g, '');
    });

    if (newContent !== original) {
        fs.writeFileSync(filePath, newContent);
        changedCount++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Finished updating globally ${changedCount} files.`);
