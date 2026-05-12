const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Question = require('../models/Question');

const MONGO_URI = process.env.MONGO_URI;
const SUBJECT = 'Chemistry';
const CHAPTER = 'Redox Reactions';
const EXAM = 'NEET';
const CLASS = '11';

const ASSERTION_REASON_OPTIONS = [
    "If both statements are true and Reason is the correct explanation of Assertion.",
    "If both statements are true but Reason is not the correct explanation of Assertion.",
    "If Assertion is true but Reason is false.",
    "If Assertion is false but Reason is true."
];

const CHART = {
    "Section 1": { range: [1, 55], easy: [1, 2, 3, 6, 10, 11, 12, 14, 16, 17, 18, 19, 21, 22, 24, 25, 26, 27, 33, 36, 37, 39], medium: [4, 5, 7, 8, 9, 13, 15, 20, 23, 28, 29, 30, 31, 32, 34, 35, 38, 40, 41, 42, 43, 44, 45, 46, 50, 51, 52, 53], hard: [47, 48, 49, 54, 55], concept: "Classical Idea, Electron Transfer & Types of Redox" },
    "Section 2": { range: [56, 106], easy: [56, 57, 59, 60, 61, 62, 63, 65, 68, 70, 71, 72, 73, 75, 76, 78, 80, 84, 86, 88, 91, 95], medium: [58, 64, 66, 67, 69, 74, 77, 79, 81, 82, 83, 85, 87, 89, 90, 92, 93, 94, 96, 97, 98, 99, 100, 101, 102, 104], hard: [103, 105, 106], concept: "Oxidation Number" },
    "Section 3": { range: [107, 118], easy: [109, 113], medium: [107, 108, 110, 111, 112, 114, 115, 116], hard: [117, 118], concept: "Balancing of Redox Reactions" },
    "Section 4": { range: [119, 137], easy: [120, 122, 123, 125, 126, 131, 134, 135, 136], medium: [119, 121, 124, 127, 128, 129, 130, 132, 133, 137], hard: [], concept: "Redox Reactions as Basis for Titrations" },
    "Section 5": { range: [138, 142], easy: [139, 140], medium: [138, 141, 142], hard: [], concept: "Redox Reactions & Electrode Process" },
    "Section 6": { range: [1, 95], easy: [1, 2, 3, 4, 5, 6, 9, 11, 13, 14, 20, 21, 22, 23, 24, 25, 26, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 54, 55, 56, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71], medium: [7, 8, 10, 12, 15, 16, 17, 18, 19, 27, 28, 29, 41, 42, 49, 57, 58, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90], hard: [91, 92, 93, 94, 95], concept: "Mixed Concept Questions" },
    "Section 7": { range: [1, 27], easy: [2, 3, 5, 6, 8, 11, 14, 18, 21, 22, 25, 27], medium: [1, 4, 7, 9, 10, 12, 13, 15, 16, 19, 20, 23, 24, 26], hard: [17], concept: "Assertion–Reason / Statement Based" },
    "Section 8": { range: [1, 5], easy: [1, 2], medium: [3, 4], hard: [5], concept: "Matrix Match Questions" },
    "Section 9": { range: [1, 27], easy: [1, 5, 10, 11, 17, 20, 21, 23, 26], medium: [2, 3, 6, 7, 9, 12, 13, 14, 15, 16, 18, 22, 24, 25, 27], hard: [4, 8, 19], concept: "Previous Year Questions (NEET)" }
};

const subMap = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', 'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ' };
const supMap = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '=': '₌', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ' };

function toUnicode(text, map) {
    if (!text) return "";
    return text.split('').map(c => map[c] || c).join('');
}

function processChemicals(text) {
    // 0. Handle LaTeX fractions first (common in balancing questions)
    text = text.replace(/\\frac{(.*?)}{(.*?)}/g, '$1/$2');

    // 1. Handle explicit superscripts like ^{2-} or ^+
    text = text.replace(/\^{([^}]*)}/g, (m, p1) => toUnicode(p1, supMap));
    text = text.replace(/\^([0-9+\-])/g, (m, p1) => toUnicode(p1, supMap));

    // 2. Handle explicit subscripts like _{2} or _3
    text = text.replace(/\_{([^}]*)}/g, (m, p1) => toUnicode(p1, subMap));
    text = text.replace(/\_([0-9])/g, (m, p1) => toUnicode(p1, subMap));

    // 3. Handle \ce{...} (mhchem)
    text = text.replace(/\\ce{(.*?)}/g, (m, p1) => {
        // Handle arrows first to create space around them
        let content = p1.replace(/->|-->/g, ' --> ');
        
        // Handle explicit charges with ^ (e.g., Na^+, SO4^2-)
        content = content.replace(/\^(\d?[\+\-])/g, (m, charge) => toUnicode(charge, supMap));

        // Handle trailing charges without ^ (e.g., MnO4-, Na+, Ca2+, SO42-)
        // DO THIS BEFORE SUBSCRIPTS so we match standard digits
        content = content.replace(/([A-Za-z\d\)])(\d?[\+\-])(?![A-Za-z\d\)])/g, (m, char, charge) => char + toUnicode(charge, supMap));

        // Handle numbers as subscripts (only when following a letter or closing bracket)
        content = content.replace(/([A-Za-z\)])(\d+)/g, (m, char, num) => char + toUnicode(num, subMap));
        
        return content;
    });

    return text;
}

function cleanText(text) {
    if (!text) return "";
    
    // Clean LaTeX comments
    text = text.split('\n').map(l => l.split('%')[0]).join('\n');

    // Handle tables (tabular) - Generate a clean "Correct Box" format
    const tabularRegex = /\\begin{tabular}{?.*?}([\s\S]*?)\\end{tabular}/g;
    text = text.replace(tabularRegex, (match, tableBody) => {
        let rows = tableBody.split('\\\\').map(r => r.trim()).filter(r => r.length > 0);
        
        let cellsMatrix = rows.map(row => {
            let cleanRow = row
                .replace(/\\hline|\\toprule|\\midrule|\\bottomrule/g, '')
                .replace(/\\multicolumn{\d+}{.*?}{(.*?)}/g, '$1')
                .replace(/{[lcr| ]+}/g, '') // Remove column definitions if they leaked in
                .trim();
            if (!cleanRow) return null;
            return cleanRow.split('&').map(c => c.trim().replace(/^\{|\}$/g, '')); // Strip outer braces from cells
        }).filter(r => r !== null);

        if (cellsMatrix.length === 0) return "";

        // Calculate column widths
        let colWidths = [];
        cellsMatrix.forEach(row => {
            row.forEach((cell, i) => {
                colWidths[i] = Math.max(colWidths[i] || 0, cell.length);
            });
        });

        // Build the box
        let topBorder = "┌" + colWidths.map(w => "─".repeat(w + 2)).join("┬") + "┐";
        let midBorder = "├" + colWidths.map(w => "─".repeat(w + 2)).join("┼") + "┤";
        let bottomBorder = "└" + colWidths.map(w => "─".repeat(w + 2)).join("┴") + "┘";

        let result = "\n" + topBorder + "\n";
        cellsMatrix.forEach((row, i) => {
            let line = "│ " + row.map((cell, j) => cell.padEnd(colWidths[j])).join(" │ ") + " │";
            result += line + "\n";
            if (i < cellsMatrix.length - 1) {
                // For headers, use a double line effect if possible or just the mid border
                result += midBorder + "\n";
            }
        });
        result += bottomBorder + "\n";
        return result;
    });

    text = processChemicals(text);

    let cleaned = text
        .replace(/\\textbf{(.*?)}/g, '$1')
        .replace(/\\textit{(.*?)}/g, '$1')
        .replace(/\\underline{(.*?)}/g, '$1')
        .replace(/\\(sub)?section\*?{.*?}/g, '')
        .replace(/\\(begin|end){(mdframed|multicols|questions|options|center|tabular|ncertbox|sectionbox|enumerate|itemize)}/g, '')
        .replace(/\[.*?\]/g, (match) => {
            if (match.includes('=') || match.includes('topsep') || match.includes('linewidth')) return '';
            return match;
        })
        .replace(/\\quad/g, ' ')
        .replace(/\\qquad/g, '  ')
        .replace(/\\rightarrow|\\to/g, ' --> ')
        .replace(/\\Delta/g, 'Δ')
        .replace(/\\hfill/g, '')
        .replace(/\\([a-zA-Z]+)\{([^}]*)\}/g, '$2') // Handle remaining commands with content
        .replace(/\\([a-zA-Z]+)/g, ' ')
        .replace(/\$(.*?)\$/g, '$1')
        .replace(/\\\\/g, '\n')
        .trim();

    // Final pass to clean up extra spaces but PRESERVE NEWLINES
    cleaned = cleaned.split('\n').map(line => {
        if (line.includes('│') || line.includes('┌') || line.includes('─') || line.includes('┬') || line.includes('┐') || line.includes('├') || line.includes('┼') || line.includes('┤') || line.includes('└') || line.includes('┴') || line.includes('┘')) {
            return line; 
        }
        return line.replace(/\s+/g, ' ').trim();
    }).join('\n');

    return cleaned;
}

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        await Question.deleteMany({ chapter: CHAPTER });
        console.log(`Deleted existing ${CHAPTER} questions.`);

        const texPath = path.join(__dirname, '../../redox_reactions_fixed.tex');
        const texContent = fs.readFileSync(texPath, 'utf-8');
        
        const lines = texContent.split('\n');
        let currentSection = "Section 1";
        let sectionCounts = { "Section 1": 0 };
        let finalQuestions = [];
        
        let i = 0;
        while (i < lines.length) {
            let line = lines[i].trim();

            if (line.includes('REDOX REACTIONS: CLASSICAL IDEA')) currentSection = "Section 1";
            else if (line.includes('OXIDATION NUMBER') && line.includes('bfseries')) currentSection = "Section 2";
            else if (line.includes('BALANCING OF REDOX REACTIONS')) currentSection = "Section 3";
            else if (line.includes('TITRATIONS')) currentSection = "Section 4";
            else if (line.includes('ELECTRODE PROCESS')) currentSection = "Section 5";
            else if (line.includes('MIXED CONCEPT QUESTIONS')) currentSection = "Section 6";
            else if (line.includes('ASSERTION--REASON / STATEMENT')) currentSection = "Section 7";
            else if (line.includes('MATRIX MATCH QUESTIONS')) currentSection = "Section 8";
            else if (line.includes('PREVIOUS YEARS\' QUESTIONS')) currentSection = "Section 9";

            if (line.startsWith('\\item')) {
                if (!sectionCounts[currentSection]) sectionCounts[currentSection] = 0;
                sectionCounts[currentSection]++;
                const n = sectionCounts[currentSection];

                let qText = line.replace('\\item', '').trim();
                let options = [];
                
                i++;
                while (i < lines.length) {
                    let nextLine = lines[i].trim();
                    if (nextLine.startsWith('\\item') || nextLine.startsWith('\\end{questions}')) break;
                    if (nextLine.startsWith('\\begin{options}') || nextLine.startsWith('\\begin{optionsA}')) {
                        i++;
                        while (i < lines.length && !lines[i].includes('\\end{options}') && !lines[i].includes('\\end{optionsA}')) {
                            if (lines[i].trim().startsWith('\\item')) {
                                options.push(lines[i].trim().replace('\\item', '').trim());
                            }
                            i++;
                        }
                    } else {
                        qText += '\n' + nextLine;
                    }
                    i++;
                }

                let finalOptions = options.map(opt => cleanText(opt));
                if (currentSection === "Section 7") {
                    finalOptions = ASSERTION_REASON_OPTIONS;
                }

                const sInfo = CHART[currentSection];
                if (sInfo) {
                    let level = 'medium';
                    if (sInfo.easy.includes(n)) level = 'easy';
                    else if (sInfo.hard.includes(n)) level = 'hard';

                    finalQuestions.push({
                        questionId: `Q-REDOX-${currentSection.replace(' ', '')}-${n}-${Date.now()}`,
                        subject: SUBJECT,
                        classes: [CLASS, EXAM],
                        chapter: CHAPTER,
                        concept: sInfo.concept,
                        level: level,
                        type: 'MCQ',
                        questionText: cleanText(qText),
                        options: finalOptions,
                        answer: ""
                    });
                }
                continue;
            }
            i++;
        }

        console.log(`Parsed ${finalQuestions.length} questions. Inserting...`);
        const chunk = 50;
        for (let j = 0; j < finalQuestions.length; j += chunk) {
            await Question.insertMany(finalQuestions.slice(j, j + chunk));
            console.log(`Inserted ${Math.min(j + chunk, finalQuestions.length)} / ${finalQuestions.length}`);
        }

        console.log('Successfully re-seeded with ultra-clean tables and chemicals!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
