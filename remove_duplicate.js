const fs = require('fs');

let lines = fs.readFileSync('motorista.html', 'utf8').split('\n');

// Vamos checar os conteúdos antes de apagar cegamente
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("        };") && lines[i+1] && lines[i+1].includes("            const container = document.getElementById('chats-list-container');")) {
        startIndex = i + 1; // 1063 (0-indexed 1062)
    }
    if (startIndex !== -1 && i > startIndex && lines[i].includes("        // Upload de foto do perfil do motorista")) {
        endIndex = i - 1; // the line before it
        break;
    }
}

if (startIndex !== -1 && endIndex !== -1) {
    console.log(`Deletando linhas ${startIndex + 1} até ${endIndex + 1}`);
    lines.splice(startIndex, endIndex - startIndex + 1);
    fs.writeFileSync('motorista.html', lines.join('\n'), 'utf8');
    console.log('Remoção concluída com sucesso!');
} else {
    console.log('Não foi possível encontrar as âncoras para deleção.');
}
