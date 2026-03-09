const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let changedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We locate the fixed navbars and remove "active-scale" from their links
    // First, find the <nav... fixed bottom-0 block till </nav>
    let newContent = content.replace(/<nav[^>]*fixed bottom-0[\s\S]*?<\/nav>/g, (match) => {
        // Inside this nav block, remove the 'active-scale' class from any tags.
        // It could be 'active-scale' or ' active-scale' or 'active-scale '
        return match.replace(/\bactive-scale\b/g, '');
    });

    if (newContent !== original) {
        fs.writeFileSync(filePath, newContent);
        changedCount++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Finished updating ${changedCount} files.`);
