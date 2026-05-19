const fs = require('fs');

const texContent = fs.readFileSync('e:\\QP\\qpg-app\\redox_reactions_fixed.tex', 'utf8');

let lines = texContent.split('\n');
let readable = '';
let inOptions = false;
let optionChar = 'A';

for (let line of lines) {
    line = line.trim();
    
    // Skip preamble and structural latex commands
    if (line.startsWith('\\documentclass') || line.startsWith('\\usepackage') || 
        line.startsWith('\\definecolor') || line.startsWith('\\pagestyle') || 
        line.startsWith('\\fancy') || line.startsWith('\\renewcommand') || 
        line.startsWith('\\titleformat') || line.startsWith('\\titlespacing') || 
        line.startsWith('\\newenvironment') || line.startsWith('\\newlist') || 
        line.startsWith('\\setlist') || line.startsWith('\\newcommand') || 
        line.startsWith('\\setlength') || line.startsWith('\\begin{document}') || 
        line.startsWith('\\end{document}') || line.startsWith('\\begin{center}') || 
        line.startsWith('\\end{center}') || line.startsWith('\\begin{multicols}') || 
        line.startsWith('\\end{multicols}') || line.startsWith('\\begin{mdframed}') || 
        line.startsWith('\\end{mdframed}') || line.startsWith('%') || 
        line.startsWith('\\vspace') || line.startsWith('\\begin{tikzpicture}') || 
        line.startsWith('\\end{tikzpicture}') || line.startsWith('\\draw') || 
        line.startsWith('\\node')) {
        continue;
    }

    // Replace basic latex formatting
    line = line.replace(/\\textbf{([^}]*)}/g, '**$1**');
    line = line.replace(/\\textit{([^}]*)}/g, '*$1*');
    line = line.replace(/\\underline{([^}]*)}/g, '_$1_');
    line = line.replace(/\\color{[^}]*}/g, '');
    line = line.replace(/\\bfseries/g, '');
    line = line.replace(/\\small/g, '');
    line = line.replace(/\\large/g, '');
    line = line.replace(/\\Large/g, '');
    line = line.replace(/\\centering/g, '');
    line = line.replace(/\\\[.*\]/g, ''); // remove like \\[4pt]
    line = line.replace(/\\\\/g, '');
    line = line.replace(/\\ce{([^}]*)}/g, '$1');
    line = line.replace(/\\to/g, '->');
    line = line.replace(/\\\^{([^}]*)}/g, '^$1');
    line = line.replace(/\\\_{([^}]*)}/g, '_$1');
    line = line.replace(/\\quad/g, ' ');
    line = line.replace(/\\Leftrightarrow/g, '<=>');

    if (line.startsWith('\\begin{questions}')) {
        continue;
    }
    if (line.startsWith('\\end{questions}')) {
        readable += '\n';
        continue;
    }
    if (line.startsWith('\\begin{options}')) {
        inOptions = true;
        optionChar = 'A';
        continue;
    }
    if (line.startsWith('\\end{options}')) {
        inOptions = false;
        readable += '\n';
        continue;
    }
    
    if (line.startsWith('\\item')) {
        if (inOptions) {
            readable += `    ${optionChar}. ` + line.replace(/\\item(\[.*?\])?\s*/, '') + '\n';
            optionChar = String.fromCharCode(optionChar.charCodeAt(0) + 1);
        } else {
            readable += '\nQ. ' + line.replace(/\\item\s*/, '') + '\n';
        }
    } else if (line.length > 0) {
        if (line === '}') continue;
        if (line === '{') continue;
        readable += line + '\n';
    }
}

fs.writeFileSync('e:\\QP\\qpg-app\\redox_readable.txt', readable);
console.log('Done!');
