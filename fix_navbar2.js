const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let changedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Specifically target the fade-in used in the body and page-enter
    // Format 1: from { opacity: 0; transform: translateY(10px); }
    content = content.replace(/from \{ opacity: 0; transform: translateY\(10px\); \}/g, 'from { opacity: 0; }');
    // Format 2: from {\n opacity: 0;\n transform: translateY(10px);\n}
    content = content.replace(/from\s*\{\s*opacity:\s*0;\s*transform:\s*translateY\(10px\);\s*\}/g, 'from { opacity: 0; }');
    // Format 3: from {\n opacity: 0;\n transform: translateY(-10px);\n}
    content = content.replace(/from\s*\{\s*opacity:\s*0;\s*transform:\s*translateY\(-10px\);\s*\}/g, 'from { opacity: 0; }');

    // Remove the translateY(0) only if it's attached to the fade-in animation 'to' block,
    // where it's formatted exactly as we added it for body fades, avoiding slideUp
    content = content.replace(/(?<=@keyframes f[F]ade(?:In|-in)[\s\S]*?)to\s*\{\s*opacity:\s*1;\s*transform:\s*translateY\(0\);\s*\}/g, 'to { opacity: 1; }');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        changedCount++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Finished updating ${changedCount} files.`);
