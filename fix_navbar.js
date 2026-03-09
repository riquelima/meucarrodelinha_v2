const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let changedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove single line transforms often found in page-enter or fadeIn keyframes
    content = content.replace(/from \{ opacity: 0; transform: translateY\(10px\); \}/g, 'from { opacity: 0; }');
    content = content.replace(/to \{ opacity: 1; transform: translateY\(0\); \}/g, 'to { opacity: 1; }');

    // Also remove multiline variants
    content = content.replace(/transform:\s*translateY\(-?10px\);\s*/g, '');
    content = content.replace(/transform:\s*translateY\(0\);\s*/g, '');

    // For any remaining transforms in keyframes related to fade in the body
    content = content.replace(/transform:\s*translateY\(10px\);/g, '');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        changedCount++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Finished updating ${changedCount} files.`);
