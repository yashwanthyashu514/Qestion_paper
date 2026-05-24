const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Question = require('../models/Question');
const OnlineExam = require('../models/OnlineExam');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qpg-app';
const CHAPTER = 'JEE WT-9 Chapter';

// Helper for rendering stacked vertical fractions in HTML
const frac = (num, den) => `<span style="display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; line-height: 1.3; margin: 0 4px; font-family: 'Times New Roman', Times, serif;"><span style="border-bottom: 1.5px solid currentColor; padding: 0 3px 2px 3px; font-size: 0.95em; font-weight: 500; font-style: italic;">${num}</span><span style="padding-top: 2px; font-size: 0.95em; font-weight: 500; font-style: italic;">${den}</span></span>`;


// Inline SVG diagrams to insert into questionText
const svgQ28 = `<br/><br/>
<svg width="160" height="150" style="display:block; margin:10px auto; background:#fff;">
  <defs>
    <marker id="arrowQ28" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/>
    </marker>
  </defs>
  <!-- I axis (vertical) -->
  <line x1="40" y1="120" x2="40" y2="15" stroke="#000" stroke-width="1.8" marker-end="url(#arrowQ28)" />
  <text x="30" y="13" font-size="15" font-weight="bold" font-family="serif">I</text>
  <!-- V axis (horizontal) -->
  <line x1="40" y1="120" x2="145" y2="120" stroke="#000" stroke-width="1.8" marker-end="url(#arrowQ28)" />
  <text x="147" y="124" font-size="15" font-weight="bold" font-family="serif">V</text>
  <!-- O at origin -->
  <text x="28" y="134" font-size="14" font-family="serif">O</text>
  <!-- Diagonal line from origin going upper-right -->
  <line x1="40" y1="120" x2="128" y2="32" stroke="#000" stroke-width="1.8" />
</svg>`;


const svgQ29 = `<br/><br/>
<svg width="180" height="100" style="background:#fff; border:1px solid #cbd5e1; border-radius:8px; padding:10px; display:block; margin:10px auto;">
  <!-- Plates -->
  <line x1="20" y1="20" x2="160" y2="20" stroke="#334155" stroke-width="4" />
  <line x1="20" y1="80" x2="160" y2="80" stroke="#334155" stroke-width="4" />
  <!-- Dielectric Slab filling 1/4th (from x=20 to x=55) -->
  <rect x="20" y="22" width="35" height="56" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5" />
  <text x="32" y="56" font-size="14" font-weight="bold" fill="#1e3a8a" font-family="Inter, sans-serif">K</text>
  <text x="95" y="56" font-size="14" fill="#64748b" font-family="Inter, sans-serif">Air</text>
  <!-- Thickness Labels -->
  <line x1="20" y1="92" x2="55" y2="92" stroke="#64748b" stroke-width="1" />
  <line x1="55" y1="92" x2="160" y2="92" stroke="#64748b" stroke-width="1" />
  <circle cx="20" cy="92" r="1.5" fill="#64748b" />
  <circle cx="55" cy="92" r="1.5" fill="#64748b" />
  <circle cx="160" cy="92" r="1.5" fill="#64748b" />
</svg>`;

const svgQ32 = `<br/><br/>
<svg width="300" height="120" style="background:#fff; border:1px solid #cbd5e1; border-radius:8px; padding:10px; display:block; margin:10px auto;">
  <!-- Terminals -->
  <circle cx="15" cy="30" r="4" fill="#000" />
  <circle cx="15" cy="90" r="4" fill="#000" />
  <!-- R1 (series top) -->
  <line x1="15" y1="30" x2="35" y2="30" stroke="#000" stroke-width="2" />
  <path d="M 35 30 L 40 22 L 48 38 L 56 22 L 64 38 L 72 22 L 80 38 L 85 30" fill="none" stroke="#000" stroke-width="2" />
  <line x1="85" y1="30" x2="120" y2="30" stroke="#000" stroke-width="2" />
  <text x="50" y="18" font-size="12" font-weight="600" font-family="Inter, sans-serif">2Ω</text>
  
  <!-- R2 (shunt 1) -->
  <line x1="120" y1="30" x2="120" y2="40" stroke="#000" stroke-width="2" />
  <path d="M 120 40 L 112 45 L 128 53 L 112 61 L 128 69 L 112 77 L 120 82" fill="none" stroke="#000" stroke-width="2" />
  <line x1="120" y1="82" x2="120" y2="90" stroke="#000" stroke-width="2" />
  <text x="132" y="64" font-size="12" font-weight="600" font-family="Inter, sans-serif">2Ω</text>
  
  <!-- R3 (series bottom) -->
  <line x1="15" y1="90" x2="35" y2="90" stroke="#000" stroke-width="2" />
  <path d="M 35 90 L 40 82 L 48 98 L 56 82 L 64 98 L 72 82 L 80 98 L 85 90" fill="none" stroke="#000" stroke-width="2" />
  <line x1="85" y1="90" x2="120" y2="90" stroke="#000" stroke-width="2" />
  <text x="50" y="108" font-size="12" font-weight="600" font-family="Inter, sans-serif">2Ω</text>
  
  <!-- Section 2 -->
  <!-- R4 (series top 2) -->
  <line x1="120" y1="30" x2="140" y2="30" stroke="#000" stroke-width="2" />
  <path d="M 140 30 L 145 22 L 153 38 L 161 22 L 169 38 L 177 22 L 185 38 L 190 30" fill="none" stroke="#000" stroke-width="2" />
  <line x1="190" y1="30" x2="220" y2="30" stroke="#000" stroke-width="2" />
  <text x="155" y="18" font-size="12" font-weight="600" font-family="Inter, sans-serif">2Ω</text>
  
  <!-- R5 (shunt 2) -->
  <line x1="220" y1="30" x2="220" y2="40" stroke="#000" stroke-width="2" />
  <path d="M 220 40 L 212 45 L 228 53 L 212 61 L 228 69 L 212 77 L 220 82" fill="none" stroke="#000" stroke-width="2" />
  <line x1="220" y1="82" x2="220" y2="90" stroke="#000" stroke-width="2" />
  <text x="232" y="64" font-size="12" font-weight="600" font-family="Inter, sans-serif">2Ω</text>
  
  <!-- R6 (series bottom 2) -->
  <line x1="120" y1="90" x2="140" y2="90" stroke="#000" stroke-width="2" />
  <path d="M 140 90 L 145 82 L 153 98 L 161 82 L 169 98 L 177 82 L 185 98 L 190 90" fill="none" stroke="#000" stroke-width="2" />
  <line x1="190" y1="90" x2="220" y2="90" stroke="#000" stroke-width="2" />
  <text x="155" y="108" font-size="12" font-weight="600" font-family="Inter, sans-serif">2Ω</text>
  
  <!-- Infinity dots -->
  <line x1="220" y1="30" x2="260" y2="30" stroke="#000" stroke-width="2" />
  <line x1="220" y1="90" x2="260" y2="90" stroke="#000" stroke-width="2" />
  <circle cx="270" cy="30" r="2" fill="#000" />
  <circle cx="277" cy="30" r="2" fill="#000" />
  <circle cx="284" cy="30" r="2" fill="#000" />
  <circle cx="270" cy="90" r="2" fill="#000" />
  <circle cx="277" cy="90" r="2" fill="#000" />
  <circle cx="284" cy="90" r="2" fill="#000" />
</svg>`;

const svgQ51 = `<br/><br/>
<svg width="280" height="130" style="background:#fff; border:1px solid #cbd5e1; border-radius:8px; padding:10px; display:block; margin:10px auto;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/>
    </marker>
  </defs>
  <!-- Toluene -->
  <g transform="translate(10, 10)">
    <polygon points="30,30 55,45 55,75 30,90 5,75 5,45" stroke="#000" stroke-width="2" fill="none" />
    <circle cx="30" cy="60" r="16" stroke="#000" stroke-width="1.5" fill="none" />
    <line x1="30" y1="30" x2="30" y2="10" stroke="#000" stroke-width="2" />
    <text x="20" y="8" font-size="11" font-weight="bold" font-family="Inter, sans-serif">CH₃</text>
  </g>
  
  <!-- Arrow 1 -->
  <g transform="translate(75, 55)">
    <line x1="0" y1="10" x2="50" y2="10" stroke="#000" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="5" y="2" font-size="10" font-family="Inter, sans-serif">Cl₂, hν</text>
  </g>
  
  <!-- Product X -->
  <g transform="translate(135, 45)">
    <rect width="25" height="25" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
    <text x="9" y="17" font-size="14" font-weight="bold" font-family="Inter, sans-serif">X</text>
  </g>
  
  <!-- Arrow 2 -->
  <g transform="translate(165, 55)">
    <line x1="0" y1="10" x2="50" y2="10" stroke="#000" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="5" y="2" font-size="10" font-family="Inter, sans-serif">aq. KOH</text>
  </g>
  
  <!-- Product Y -->
  <g transform="translate(225, 45)">
    <rect width="25" height="25" rx="4" fill="#ede9fe" stroke="#a78bfa" />
    <text x="9" y="17" font-size="14" font-weight="bold" font-family="Inter, sans-serif" fill="#5b21b6">Y</text>
  </g>
</svg>`;

// Q51 Option SVGs
const svgQ51Opt1 = `<svg width="100" height="120" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <polygon points="50,40 70,51 70,74 50,85 30,74 30,51" stroke="#000" stroke-width="1.5" fill="none" />
  <circle cx="50" cy="62.5" r="13" stroke="#000" stroke-width="1.2" fill="none" />
  <line x1="50" y1="40" x2="50" y2="24" stroke="#000" stroke-width="1.5" />
  <text x="40" y="21" font-size="10" font-weight="bold" font-family="sans-serif">CH₃</text>
  <line x1="70" y1="51" x2="82" y2="44" stroke="#000" stroke-width="1.5" />
  <text x="83" y="44" font-size="10" font-weight="bold" font-family="sans-serif">OH</text>
</svg>`;

const svgQ51Opt2 = `<svg width="100" height="120" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <polygon points="50,40 70,51 70,74 50,85 30,74 30,51" stroke="#000" stroke-width="1.5" fill="none" />
  <circle cx="50" cy="62.5" r="13" stroke="#000" stroke-width="1.2" fill="none" />
  <line x1="50" y1="40" x2="50" y2="24" stroke="#000" stroke-width="1.5" />
  <text x="40" y="21" font-size="10" font-weight="bold" font-family="sans-serif">CH₃</text>
  <line x1="70" y1="74" x2="82" y2="81" stroke="#000" stroke-width="1.5" />
  <text x="83" y="85" font-size="10" font-weight="bold" font-family="sans-serif">OH</text>
</svg>`;

const svgQ51Opt3 = `<svg width="100" height="120" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <polygon points="50,40 70,51 70,74 50,85 30,74 30,51" stroke="#000" stroke-width="1.5" fill="none" />
  <circle cx="50" cy="62.5" r="13" stroke="#000" stroke-width="1.2" fill="none" />
  <line x1="50" y1="40" x2="50" y2="24" stroke="#000" stroke-width="1.5" />
  <text x="34" y="21" font-size="10" font-weight="bold" font-family="sans-serif">CH₂OH</text>
</svg>`;

const svgQ51Opt4 = `<svg width="100" height="120" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <polygon points="50,40 70,51 70,74 50,85 30,74 30,51" stroke="#000" stroke-width="1.5" fill="none" />
  <circle cx="50" cy="62.5" r="13" stroke="#000" stroke-width="1.2" fill="none" />
  <line x1="50" y1="40" x2="50" y2="24" stroke="#000" stroke-width="1.5" />
  <text x="40" y="21" font-size="10" font-weight="bold" font-family="sans-serif">CH₃</text>
  <line x1="30" y1="74" x2="18" y2="81" stroke="#000" stroke-width="1.5" />
  <text x="2" y="85" font-size="10" font-weight="bold" font-family="sans-serif">OH</text>
  <line x1="70" y1="74" x2="82" y2="81" stroke="#000" stroke-width="1.5" />
  <text x="83" y="85" font-size="10" font-weight="bold" font-family="sans-serif">OH</text>
</svg>`;

// Q52 Reactant & Options
const svgQ52Reactant = `<br/><br/>
<svg width="280" height="130" style="display:inline-block; vertical-align:middle; margin:5px; background:#fff;">
  <defs>
    <marker id="arrow52" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/>
    </marker>
  </defs>
  <text x="10" y="90" font-size="14" font-family="serif">Ph</text>
  <line x1="30" y1="85" x2="50" y2="70" stroke="#000" stroke-width="1.5" />
  <!-- Me up -->
  <line x1="50" y1="70" x2="50" y2="45" stroke="#000" stroke-width="1.5" />
  <!-- down-right -->
  <line x1="50" y1="70" x2="75" y2="90" stroke="#000" stroke-width="1.5" />
  <!-- Br down -->
  <line x1="75" y1="90" x2="75" y2="115" stroke="#000" stroke-width="1.5" />
  <text x="69" y="127" font-size="12" font-family="serif">Br</text>
  <!-- up-right -->
  <line x1="75" y1="90" x2="100" y2="70" stroke="#000" stroke-width="1.5" />
  <!-- Br up -->
  <line x1="100" y1="70" x2="100" y2="45" stroke="#000" stroke-width="1.5" />
  <text x="94" y="40" font-size="12" font-family="serif">Br</text>
  <!-- down-right -->
  <line x1="100" y1="70" x2="125" y2="90" stroke="#000" stroke-width="1.5" />
  <!-- up-right -->
  <line x1="125" y1="90" x2="150" y2="70" stroke="#000" stroke-width="1.5" />
  
  <!-- Arrow -->
  <line x1="165" y1="80" x2="255" y2="80" stroke="#000" stroke-width="1.5" marker-end="url(#arrow52)" />
  <text x="165" y="70" font-size="12" font-family="serif">KOH alc (excess)</text>
  <text x="205" y="95" font-size="12" font-family="serif">Δ</text>
</svg>`;

const svgQ52Opt1 = `<svg width="120" height="120" style="display:inline-block; vertical-align:middle; margin:5px; background:#fff;">
  <text x="10" y="105" font-size="14" font-family="serif">Ph</text>
  <line x1="28" y1="100" x2="45" y2="85" stroke="#000" stroke-width="1.5" />
  <!-- Me up -->
  <line x1="45" y1="85" x2="45" y2="55" stroke="#000" stroke-width="1.5" />
  <!-- down-right -->
  <line x1="45" y1="85" x2="70" y2="100" stroke="#000" stroke-width="1.5" />
  <!-- up-right double -->
  <line x1="70" y1="100" x2="95" y2="85" stroke="#000" stroke-width="1.5" />
  <line x1="68" y1="95" x2="93" y2="80" stroke="#000" stroke-width="1.5" />
  <!-- straight up single -->
  <line x1="95" y1="85" x2="95" y2="55" stroke="#000" stroke-width="1.5" />
  <!-- up-left double -->
  <line x1="95" y1="55" x2="70" y2="40" stroke="#000" stroke-width="1.5" />
  <line x1="93" y1="60" x2="68" y2="45" stroke="#000" stroke-width="1.5" />
</svg>`;

const svgQ52Opt2 = `<svg width="170" height="100" style="display:inline-block; vertical-align:middle; margin:5px; background:#fff;">
  <text x="10" y="85" font-size="14" font-family="serif">Ph</text>
  <!-- up-right double -->
  <line x1="30" y1="80" x2="55" y2="65" stroke="#000" stroke-width="1.5" />
  <line x1="32" y1="75" x2="57" y2="60" stroke="#000" stroke-width="1.5" />
  <!-- Me up -->
  <line x1="55" y1="65" x2="55" y2="35" stroke="#000" stroke-width="1.5" />
  <!-- down-right single -->
  <line x1="55" y1="65" x2="80" y2="80" stroke="#000" stroke-width="1.5" />
  <!-- up-right single -->
  <line x1="80" y1="80" x2="105" y2="65" stroke="#000" stroke-width="1.5" />
  <!-- down-right double -->
  <line x1="105" y1="65" x2="130" y2="80" stroke="#000" stroke-width="1.5" />
  <line x1="103" y1="70" x2="128" y2="85" stroke="#000" stroke-width="1.5" />
  <!-- up-right single -->
  <line x1="130" y1="80" x2="155" y2="65" stroke="#000" stroke-width="1.5" />
</svg>`;

const svgQ52Opt3 = `<svg width="150" height="100" style="display:inline-block; vertical-align:middle; margin:5px; background:#fff;">
  <text x="10" y="75" font-size="14" font-family="serif">Ph</text>
  <!-- Me up -->
  <line x1="30" y1="70" x2="30" y2="40" stroke="#000" stroke-width="1.5" />
  <!-- down-right double -->
  <line x1="30" y1="70" x2="55" y2="85" stroke="#000" stroke-width="1.5" />
  <line x1="32" y1="65" x2="57" y2="80" stroke="#000" stroke-width="1.5" />
  <!-- up-right single -->
  <line x1="55" y1="85" x2="80" y2="70" stroke="#000" stroke-width="1.5" />
  <!-- down-right double -->
  <line x1="80" y1="70" x2="105" y2="85" stroke="#000" stroke-width="1.5" />
  <line x1="78" y1="65" x2="103" y2="80" stroke="#000" stroke-width="1.5" />
  <!-- up-right single -->
  <line x1="105" y1="85" x2="130" y2="70" stroke="#000" stroke-width="1.5" />
  <!-- straight up single -->
  <line x1="130" y1="70" x2="130" y2="40" stroke="#000" stroke-width="1.5" />
</svg>`;

const svgQ52Opt4 = `<svg width="180" height="90" style="display:inline-block; vertical-align:middle; margin:5px; background:#fff;">
  <text x="10" y="75" font-size="14" font-family="serif">Ph</text>
  <!-- up-right single -->
  <line x1="28" y1="70" x2="50" y2="55" stroke="#000" stroke-width="1.5" />
  <!-- Me up -->
  <line x1="50" y1="55" x2="50" y2="25" stroke="#000" stroke-width="1.5" />
  <!-- down-right single -->
  <line x1="50" y1="55" x2="75" y2="70" stroke="#000" stroke-width="1.5" />
  <!-- up-right double -->
  <line x1="75" y1="70" x2="100" y2="55" stroke="#000" stroke-width="1.5" />
  <line x1="77" y1="65" x2="102" y2="50" stroke="#000" stroke-width="1.5" />
  <!-- down-right single -->
  <line x1="100" y1="55" x2="125" y2="70" stroke="#000" stroke-width="1.5" />
  <!-- up-right double -->
  <line x1="125" y1="70" x2="150" y2="55" stroke="#000" stroke-width="1.5" />
  <line x1="127" y1="65" x2="152" y2="50" stroke="#000" stroke-width="1.5" />
  <!-- down-right single -->
  <line x1="150" y1="55" x2="175" y2="70" stroke="#000" stroke-width="1.5" />
</svg>`;

// Q54 Reactant & Options
const svgQ54Reactant = `<br/><br/>
<svg width="150" height="120" style="display:block; margin:10px auto; background:#fff;">
  <!-- Cyclohexane ring -->
  <polygon points="50,40 70,52 70,75 50,87 30,75 30,52" stroke="#000" stroke-width="1.5" fill="none" />
  <!-- Bond up-right to C -->
  <line x1="70" y1="52" x2="90" y2="40" stroke="#000" stroke-width="1.5" />
  <!-- Methyl up -->
  <line x1="90" y1="40" x2="90" y2="15" stroke="#000" stroke-width="1.5" />
  <!-- Ethyl down-right then up-right -->
  <line x1="90" y1="40" x2="110" y2="52" stroke="#000" stroke-width="1.5" />
  <line x1="110" y1="52" x2="130" y2="40" stroke="#000" stroke-width="1.5" />
  <!-- OH straight down -->
  <line x1="90" y1="40" x2="90" y2="65" stroke="#000" stroke-width="1.5" />
  <text x="83" y="80" font-size="12" font-family="serif">OH</text>
</svg>`;

const svgQ54Opt1 = `<svg width="140" height="100" style="display:inline-block; vertical-align:middle; margin:5px; background:#fff;">
  <!-- Cyclohexane ring -->
  <polygon points="40,30 60,42 60,65 40,77 20,65 20,42" stroke="#000" stroke-width="1.5" fill="none" />
  <!-- Single bond up-right -->
  <line x1="60" y1="42" x2="80" y2="30" stroke="#000" stroke-width="1.5" />
  <!-- Methyl up -->
  <line x1="80" y1="30" x2="80" y2="10" stroke="#000" stroke-width="1.5" />
  <!-- Double bond down-right -->
  <line x1="80" y1="30" x2="100" y2="42" stroke="#000" stroke-width="1.5" />
  <line x1="78" y1="34" x2="98" y2="46" stroke="#000" stroke-width="1.5" />
  <!-- Single bond up-right -->
  <line x1="100" y1="42" x2="120" y2="30" stroke="#000" stroke-width="1.5" />
</svg>`;

const svgQ54Opt2 = `<svg width="140" height="100" style="display:inline-block; vertical-align:middle; margin:5px; background:#fff;">
  <!-- Cyclohexane ring -->
  <polygon points="40,30 60,42 60,65 40,77 20,65 20,42" stroke="#000" stroke-width="1.5" fill="none" />
  <!-- Double bond up-right -->
  <line x1="60" y1="42" x2="80" y2="30" stroke="#000" stroke-width="1.5" />
  <line x1="58" y1="38" x2="78" y2="26" stroke="#000" stroke-width="1.5" />
  <!-- Methyl up -->
  <line x1="80" y1="30" x2="80" y2="10" stroke="#000" stroke-width="1.5" />
  <!-- Single bond down-right -->
  <line x1="80" y1="30" x2="100" y2="42" stroke="#000" stroke-width="1.5" />
  <!-- Single bond up-right -->
  <line x1="100" y1="42" x2="120" y2="30" stroke="#000" stroke-width="1.5" />
</svg>`;

const svgQ54Opt3 = `<svg width="140" height="100" style="display:inline-block; vertical-align:middle; margin:5px; background:#fff;">
  <!-- Cyclohexane ring -->
  <polygon points="40,30 60,42 60,65 40,77 20,65 20,42" stroke="#000" stroke-width="1.5" fill="none" />
  <!-- Single bond up-right -->
  <line x1="60" y1="42" x2="80" y2="30" stroke="#000" stroke-width="1.5" />
  <!-- Double bond up -->
  <line x1="80" y1="30" x2="80" y2="10" stroke="#000" stroke-width="1.5" />
  <line x1="76" y1="30" x2="76" y2="10" stroke="#000" stroke-width="1.5" />
  <!-- Single bond down-right -->
  <line x1="80" y1="30" x2="100" y2="42" stroke="#000" stroke-width="1.5" />
  <!-- Single bond up-right -->
  <line x1="100" y1="42" x2="120" y2="30" stroke="#000" stroke-width="1.5" />
</svg>`;

const svgQ54Opt4 = `<svg width="140" height="100" style="display:inline-block; vertical-align:middle; margin:5px; background:#fff;">
  <!-- Cyclohexane ring WITH double bond inside -->
  <polygon points="40,30 60,42 60,65 40,77 20,65 20,42" stroke="#000" stroke-width="1.5" fill="none" />
  <!-- Double bond from top-right vertex to top vertex -->
  <line x1="42" y1="35" x2="58" y2="44.6" stroke="#000" stroke-width="1.5" />
  <!-- Single bond up-right -->
  <line x1="60" y1="42" x2="80" y2="30" stroke="#000" stroke-width="1.5" />
  <!-- Methyl up -->
  <line x1="80" y1="30" x2="80" y2="10" stroke="#000" stroke-width="1.5" />
  <!-- Single bond down-right -->
  <line x1="80" y1="30" x2="100" y2="42" stroke="#000" stroke-width="1.5" />
  <!-- Single bond up-right -->
  <line x1="100" y1="42" x2="120" y2="30" stroke="#000" stroke-width="1.5" />
</svg>`;

// Q60 Reactant & Options
const svgQ60Reactant = `<br/><br/>
<svg width="340" height="120" style="background:#fff; border:1px solid #cbd5e1; border-radius:8px; padding:10px; display:block; margin:10px auto;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/>
    </marker>
  </defs>
  <!-- Left Ring -->
  <g transform="translate(45, 20)">
    <polygon points="25,15 45,26.5 45,49.5 25,61 5,49.5 5,26.5" stroke="#000" stroke-width="1.5" fill="none" />
    <circle cx="25" cy="38" r="11" stroke="#000" stroke-width="1.2" fill="none" />
    <!-- O2N on left -->
    <line x1="5" y1="38" x2="-10" y2="38" stroke="#000" stroke-width="1.5" />
    <text x="-32" y="42" font-size="10" font-weight="bold" font-family="sans-serif">O₂N</text>
    <!-- Bond to C -->
    <line x1="45" y1="38" x2="62" y2="38" stroke="#000" stroke-width="1.5" />
  </g>
  
  <!-- Middle Triple Bond -->
  <text x="112" y="62" font-size="12" font-weight="bold" font-family="sans-serif">C</text>
  <line x1="124" y1="54" x2="144" y2="54" stroke="#000" stroke-width="1.5" />
  <line x1="124" y1="58" x2="144" y2="58" stroke="#000" stroke-width="1.5" />
  <line x1="124" y1="62" x2="144" y2="62" stroke="#000" stroke-width="1.5" />
  <text x="146" y="62" font-size="12" font-weight="bold" font-family="sans-serif">C</text>
  
  <!-- Right Ring -->
  <g transform="translate(155, 20)">
    <!-- Bond from C -->
    <line x1="3" y1="38" x2="20" y2="38" stroke="#000" stroke-width="1.5" />
    <polygon points="40,15 60,26.5 60,49.5 40,61 20,49.5 20,26.5" stroke="#000" stroke-width="1.5" fill="none" />
    <circle cx="40" cy="38" r="11" stroke="#000" stroke-width="1.2" fill="none" />
  </g>

  <!-- Arrow -->
  <line x1="240" y1="58" x2="295" y2="58" stroke="#000" stroke-width="1.5" marker-end="url(#arrow)" />
  <text x="242" y="50" font-size="8" font-family="sans-serif">H₂O/HgSO₄</text>
  <text x="242" y="68" font-size="8" font-family="sans-serif">40% H₂SO₄</text>
</svg>`;

const svgQ60Opt1 = `<svg width="240" height="90" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <!-- Left ring -->
  <g transform="translate(25, 20)">
    <polygon points="20,10 35,18.5 35,36.5 20,45 5,36.5 5,18.5" stroke="#000" stroke-width="1.5" fill="none" />
    <circle cx="20" cy="27.5" r="8" stroke="#000" stroke-width="1.2" fill="none" />
    <line x1="5" y1="27.5" x2="-5" y2="27.5" stroke="#000" stroke-width="1.5" />
    <text x="-25" y="31" font-size="8" font-family="sans-serif">O₂N</text>
  </g>
  <!-- Connection: C(=O)-CH2 -->
  <line x1="60" y1="47.5" x2="72" y2="47.5" stroke="#000" stroke-width="1.5" />
  <text x="75" y="52" font-size="12" font-family="sans-serif">C</text>
  <!-- Double bond up to O -->
  <line x1="77" y1="38" x2="77" y2="24" stroke="#000" stroke-width="1.5" />
  <line x1="81" y1="38" x2="81" y2="24" stroke="#000" stroke-width="1.5" />
  <text x="75" y="20" font-size="12" font-family="sans-serif">O</text>
  
  <line x1="85" y1="47.5" x2="95" y2="47.5" stroke="#000" stroke-width="1.5" />
  <text x="98" y="52" font-size="12" font-family="sans-serif">CH₂</text>
  
  <line x1="122" y1="47.5" x2="165" y2="47.5" stroke="#000" stroke-width="1.5" />
  
  <!-- Right ring -->
  <g transform="translate(140, 20)">
    <polygon points="40,10 55,18.5 55,36.5 40,45 25,36.5 25,18.5" stroke="#000" stroke-width="1.5" fill="none" />
    <circle cx="40" cy="27.5" r="8" stroke="#000" stroke-width="1.2" fill="none" />
  </g>
</svg>`;

const svgQ60Opt2 = `<svg width="240" height="90" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <g transform="translate(25, 20)">
    <polygon points="20,10 35,18.5 35,36.5 20,45 5,36.5 5,18.5" stroke="#000" stroke-width="1.5" fill="none" />
    <circle cx="20" cy="27.5" r="8" stroke="#000" stroke-width="1.2" fill="none" />
    <line x1="5" y1="27.5" x2="-5" y2="27.5" stroke="#000" stroke-width="1.5" />
    <text x="-25" y="31" font-size="8" font-family="sans-serif">O₂N</text>
  </g>
  <!-- Connection: CH2-C(=O) -->
  <line x1="60" y1="47.5" x2="72" y2="47.5" stroke="#000" stroke-width="1.5" />
  <text x="75" y="52" font-size="12" font-family="sans-serif">CH₂</text>
  
  <line x1="100" y1="47.5" x2="110" y2="47.5" stroke="#000" stroke-width="1.5" />
  <text x="113" y="52" font-size="12" font-family="sans-serif">C</text>
  <!-- Double bond up to O -->
  <line x1="115" y1="38" x2="115" y2="24" stroke="#000" stroke-width="1.5" />
  <line x1="119" y1="38" x2="119" y2="24" stroke="#000" stroke-width="1.5" />
  <text x="113" y="20" font-size="12" font-family="sans-serif">O</text>
  
  <line x1="123" y1="47.5" x2="165" y2="47.5" stroke="#000" stroke-width="1.5" />
  
  <g transform="translate(140, 20)">
    <polygon points="40,10 55,18.5 55,36.5 40,45 25,36.5 25,18.5" stroke="#000" stroke-width="1.5" fill="none" />
    <circle cx="40" cy="27.5" r="8" stroke="#000" stroke-width="1.2" fill="none" />
  </g>
</svg>`;

const svgQ60Opt3 = `<svg width="240" height="90" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <g transform="translate(25, 20)">
    <polygon points="20,10 35,18.5 35,36.5 20,45 5,36.5 5,18.5" stroke="#000" stroke-width="1.5" fill="none" />
    <circle cx="20" cy="27.5" r="8" stroke="#000" stroke-width="1.2" fill="none" />
    <line x1="5" y1="27.5" x2="-5" y2="27.5" stroke="#000" stroke-width="1.5" />
    <text x="-25" y="31" font-size="8" font-family="sans-serif">O₂N</text>
  </g>
  <!-- Connection: CH2-CH(OH) -->
  <line x1="60" y1="47.5" x2="72" y2="47.5" stroke="#000" stroke-width="1.5" />
  <text x="75" y="52" font-size="12" font-family="sans-serif">CH₂</text>
  
  <line x1="100" y1="47.5" x2="110" y2="47.5" stroke="#000" stroke-width="1.5" />
  <text x="113" y="52" font-size="12" font-family="sans-serif">CH</text>
  <!-- Single bond up to OH -->
  <line x1="120" y1="38" x2="120" y2="24" stroke="#000" stroke-width="1.5" />
  <text x="113" y="20" font-size="12" font-family="sans-serif">OH</text>
  
  <line x1="130" y1="47.5" x2="165" y2="47.5" stroke="#000" stroke-width="1.5" />
  
  <g transform="translate(140, 20)">
    <polygon points="40,10 55,18.5 55,36.5 40,45 25,36.5 25,18.5" stroke="#000" stroke-width="1.5" fill="none" />
    <circle cx="40" cy="27.5" r="8" stroke="#000" stroke-width="1.2" fill="none" />
  </g>
</svg>`;

const svgQ60Opt4 = `<svg width="240" height="90" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <g transform="translate(25, 20)">
    <polygon points="20,10 35,18.5 35,36.5 20,45 5,36.5 5,18.5" stroke="#000" stroke-width="1.5" fill="none" />
    <circle cx="20" cy="27.5" r="8" stroke="#000" stroke-width="1.2" fill="none" />
    <line x1="5" y1="27.5" x2="-5" y2="27.5" stroke="#000" stroke-width="1.5" />
    <text x="-25" y="31" font-size="8" font-family="sans-serif">O₂N</text>
  </g>
  <!-- Connection: CH(OH)-CH(OH) -->
  <line x1="60" y1="47.5" x2="72" y2="47.5" stroke="#000" stroke-width="1.5" />
  <text x="75" y="52" font-size="12" font-family="sans-serif">CH</text>
  <line x1="82" y1="38" x2="82" y2="24" stroke="#000" stroke-width="1.5" />
  <text x="75" y="20" font-size="12" font-family="sans-serif">OH</text>
  
  <line x1="94" y1="47.5" x2="104" y2="47.5" stroke="#000" stroke-width="1.5" />
  <text x="107" y="52" font-size="12" font-family="sans-serif">CH</text>
  <line x1="114" y1="38" x2="114" y2="24" stroke="#000" stroke-width="1.5" />
  <text x="107" y="20" font-size="12" font-family="sans-serif">OH</text>
  
  <line x1="126" y1="47.5" x2="165" y2="47.5" stroke="#000" stroke-width="1.5" />
  
  <g transform="translate(140, 20)">
    <polygon points="40,10 55,18.5 55,36.5 40,45 25,36.5 25,18.5" stroke="#000" stroke-width="1.5" fill="none" />
    <circle cx="40" cy="27.5" r="8" stroke="#000" stroke-width="1.2" fill="none" />
  </g>
</svg>`;

// Q61 Reactant & Options
const svgQ61Reactant = `<br/><br/>
<svg width="220" height="110" style="background:#fff; display:block; margin:10px auto;">
  <defs>
    <marker id="arrow61" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/>
    </marker>
  </defs>
  <!-- Cyclopentane ring -->
  <polygon points="40,40 60,55 52,80 28,80 20,55" stroke="#000" stroke-width="1.5" fill="none" />
  <line x1="40" y1="40" x2="40" y2="20" stroke="#000" stroke-width="1.5" />
  <text x="31" y="15" font-size="12" font-family="serif">CH<tspan font-size="9" dy="4">3</tspan></text>
  <!-- Arrow -->
  <line x1="85" y1="55" x2="145" y2="55" stroke="#000" stroke-width="1.5" marker-end="url(#arrow61)" />
  <text x="90" y="47" font-size="12" font-family="serif">Br<tspan font-size="9" dy="4">2</tspan><tspan dy="-4">, sunlight</tspan></text>
</svg>`;

const svgQ61Opt1 = `<svg width="100" height="120" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <polygon points="45,60 65,75 57,100 33,100 25,75" stroke="#000" stroke-width="1.5" fill="none" />
  <line x1="45" y1="60" x2="45" y2="37" stroke="#000" stroke-width="1.5" />
  <text x="19" y="32" font-size="12" font-family="serif">CH<tspan font-size="9" dy="4">2</tspan><tspan dy="-4">Br</tspan></text>
</svg>`;

const svgQ61Opt2 = `<svg width="110" height="120" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <polygon points="40,60 60,75 52,100 28,100 20,75" stroke="#000" stroke-width="1.5" fill="none" />
  <line x1="40" y1="60" x2="40" y2="40" stroke="#000" stroke-width="1.5" />
  <text x="28" y="35" font-size="12" font-family="serif">CH<tspan font-size="9" dy="4">3</tspan></text>
  <!-- Br at 2-position, right side -->
  <line x1="60" y1="75" x2="78" y2="67" stroke="#000" stroke-width="1.5" />
  <text x="80" y="70" font-size="12" font-family="serif">Br</text>
</svg>`;

const svgQ61Opt3 = `<svg width="110" height="120" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <polygon points="40,60 60,75 52,100 28,100 20,75" stroke="#000" stroke-width="1.5" fill="none" />
  <line x1="40" y1="60" x2="40" y2="40" stroke="#000" stroke-width="1.5" />
  <text x="28" y="35" font-size="12" font-family="serif">CH<tspan font-size="9" dy="4">3</tspan></text>
  <!-- Br at 1-position (tertiary) -->
  <line x1="40" y1="60" x2="58" y2="50" stroke="#000" stroke-width="1.5" />
  <text x="60" y="53" font-size="12" font-family="serif">Br</text>
</svg>`;

const svgQ61Opt4 = `<svg width="100" height="120" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <polygon points="40,60 60,75 52,100 28,100 20,75" stroke="#000" stroke-width="1.5" fill="none" />
  <line x1="40" y1="60" x2="40" y2="40" stroke="#000" stroke-width="1.5" />
  <text x="28" y="35" font-size="12" font-family="serif">CH<tspan font-size="9" dy="4">3</tspan></text>
  <!-- Br at 3-position, bottom-right -->
  <line x1="52" y1="100" x2="67" y2="110" stroke="#000" stroke-width="1.5" />
  <text x="69" y="115" font-size="12" font-family="serif">Br</text>
</svg>`;

// Q65 Option SVGs
const svgQ65Opt1 = `<svg width="180" height="90" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <text x="10" y="48" font-size="11" font-weight="bold" font-family="monospace">CH₃</text>
  <line x1="38" y1="44" x2="52" y2="44" stroke="#000" stroke-width="1.5" />
  <text x="56" y="48" font-size="11" font-weight="bold" font-family="monospace">C</text>
  <line x1="60" y1="36" x2="60" y2="24" stroke="#000" stroke-width="1.5" />
  <text x="54" y="20" font-size="11" font-weight="bold" font-family="monospace">Br</text>
  <line x1="60" y1="52" x2="60" y2="64" stroke="#000" stroke-width="1.5" />
  <text x="50" y="76" font-size="11" font-weight="bold" font-family="monospace">CH₃</text>
  <line x1="68" y1="44" x2="82" y2="44" stroke="#000" stroke-width="1.5" />
  <text x="86" y="48" font-size="11" font-weight="bold" font-family="monospace">CH₂</text>
  <line x1="108" y1="44" x2="122" y2="44" stroke="#000" stroke-width="1.5" />
  <text x="126" y="48" font-size="11" font-weight="bold" font-family="monospace">Br</text>
</svg>`;

const svgQ65Opt2 = `<svg width="180" height="90" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <text x="10" y="48" font-size="11" font-weight="bold" font-family="monospace">CH₃</text>
  <line x1="38" y1="44" x2="52" y2="44" stroke="#000" stroke-width="1.5" />
  <text x="56" y="48" font-size="11" font-weight="bold" font-family="monospace">CH</text>
  <line x1="64" y1="52" x2="64" y2="64" stroke="#000" stroke-width="1.5" />
  <text x="54" y="76" font-size="11" font-weight="bold" font-family="monospace">CH₂Br</text>
  <line x1="74" y1="44" x2="88" y2="44" stroke="#000" stroke-width="1.5" />
  <text x="92" y="48" font-size="11" font-weight="bold" font-family="monospace">CH₂Br</text>
</svg>`;

const svgQ65Opt3 = `<svg width="180" height="90" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <text x="10" y="48" font-size="11" font-weight="bold" font-family="monospace">CH₃</text>
  <line x1="38" y1="44" x2="52" y2="44" stroke="#000" stroke-width="1.5" />
  <text x="56" y="48" font-size="11" font-weight="bold" font-family="monospace">CH</text>
  <line x1="64" y1="52" x2="64" y2="64" stroke="#000" stroke-width="1.5" />
  <text x="54" y="76" font-size="11" font-weight="bold" font-family="monospace">CH₃</text>
  <line x1="74" y1="44" x2="88" y2="44" stroke="#000" stroke-width="1.5" />
  <text x="92" y="48" font-size="11" font-weight="bold" font-family="monospace">CH₂Br</text>
</svg>`;

const svgQ65Opt4 = `<svg width="180" height="90" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <text x="10" y="48" font-size="11" font-weight="bold" font-family="monospace">CH₃</text>
  <line x1="38" y1="44" x2="52" y2="44" stroke="#000" stroke-width="1.5" />
  <text x="56" y="48" font-size="11" font-weight="bold" font-family="monospace">C</text>
  <line x1="60" y1="36" x2="60" y2="24" stroke="#000" stroke-width="1.5" />
  <text x="50" y="20" font-size="11" font-weight="bold" font-family="monospace">CH₃</text>
  <line x1="60" y1="52" x2="60" y2="64" stroke="#000" stroke-width="1.5" />
  <text x="50" y="76" font-size="11" font-weight="bold" font-family="monospace">CH₃</text>
  <line x1="68" y1="44" x2="82" y2="44" stroke="#000" stroke-width="1.5" />
  <text x="86" y="48" font-size="11" font-weight="bold" font-family="monospace">Br</text>
</svg>`;

// Q68 Reactant & Options
const svgQ68Reactant = `<br/><br/>
<svg width="260" height="140" style="background:#fff; display:block; margin:10px auto;">
  <defs>
    <marker id="arrow68" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/>
    </marker>
  </defs>
  <!-- Benzene Ring (hexagon) -->
  <polygon points="65,35 92,52 92,85 65,102 38,85 38,52" stroke="#000" stroke-width="1.5" fill="none" />
  <!-- Inner circle -->
  <circle cx="65" cy="68" r="18" stroke="#000" stroke-width="1.2" fill="none" />
  <!-- CH2OH at top-right -->
  <line x1="92" y1="52" x2="110" y2="38" stroke="#000" stroke-width="1.5" />
  <text x="112" y="36" font-size="12" font-family="serif">CH<tspan font-size="9" dy="4">2</tspan><tspan dy="-4">OH</tspan></text>
  <!-- OH at bottom-left -->
  <line x1="38" y1="85" x2="20" y2="100" stroke="#000" stroke-width="1.5" />
  <text x="5" y="115" font-size="12" font-family="serif">OH</text>
  <!-- Arrow + HCl heat -->
  <line x1="150" y1="68" x2="215" y2="68" stroke="#000" stroke-width="1.5" marker-end="url(#arrow68)" />
  <text x="155" y="58" font-size="12" font-family="serif">+ HCl</text>
  <text x="162" y="83" font-size="12" font-family="serif">heat</text>
  <text x="220" y="73" font-size="14" font-weight="bold" font-family="serif">P</text>
</svg>`;

const svgQ68Opt1 = `<svg width="130" height="130" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <polygon points="55,40 80,55 80,88 55,103 30,88 30,55" stroke="#000" stroke-width="1.5" fill="none" />
  <circle cx="55" cy="72" r="17" stroke="#000" stroke-width="1.2" fill="none" />
  <!-- CH2Cl top-right -->
  <line x1="80" y1="55" x2="97" y2="42" stroke="#000" stroke-width="1.5" />
  <text x="99" y="40" font-size="12" font-family="serif">CH<tspan font-size="9" dy="4">2</tspan><tspan dy="-4">Cl</tspan></text>
  <!-- Cl bottom-left -->
  <line x1="30" y1="88" x2="13" y2="100" stroke="#000" stroke-width="1.5" />
  <text x="2" y="113" font-size="12" font-family="serif">Cl</text>
</svg>`;

const svgQ68Opt2 = `<svg width="130" height="130" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <polygon points="55,40 80,55 80,88 55,103 30,88 30,55" stroke="#000" stroke-width="1.5" fill="none" />
  <circle cx="55" cy="72" r="17" stroke="#000" stroke-width="1.2" fill="none" />
  <!-- CH2Cl top-right -->
  <line x1="80" y1="55" x2="97" y2="42" stroke="#000" stroke-width="1.5" />
  <text x="99" y="40" font-size="12" font-family="serif">CH<tspan font-size="9" dy="4">2</tspan><tspan dy="-4">Cl</tspan></text>
  <!-- HO bottom-left -->
  <line x1="30" y1="88" x2="13" y2="100" stroke="#000" stroke-width="1.5" />
  <text x="2" y="113" font-size="12" font-family="serif">HO</text>
</svg>`;

const svgQ68Opt3 = `<svg width="130" height="130" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <polygon points="55,40 80,55 80,88 55,103 30,88 30,55" stroke="#000" stroke-width="1.5" fill="none" />
  <circle cx="55" cy="72" r="17" stroke="#000" stroke-width="1.2" fill="none" />
  <!-- CH2OH top-right -->
  <line x1="80" y1="55" x2="97" y2="42" stroke="#000" stroke-width="1.5" />
  <text x="99" y="40" font-size="12" font-family="serif">CH<tspan font-size="9" dy="4">2</tspan><tspan dy="-4">OH</tspan></text>
  <!-- Cl bottom-left -->
  <line x1="30" y1="88" x2="13" y2="100" stroke="#000" stroke-width="1.5" />
  <text x="2" y="113" font-size="12" font-family="serif">Cl</text>
</svg>`;

const svgQ68Opt4 = `<svg width="130" height="130" style="background:#fff; display:inline-block; vertical-align:middle; margin:5px;">
  <polygon points="55,40 80,55 80,88 55,103 30,88 30,55" stroke="#000" stroke-width="1.5" fill="none" />
  <circle cx="55" cy="72" r="17" stroke="#000" stroke-width="1.2" fill="none" />
  <!-- CH2OH top-right -->
  <line x1="80" y1="55" x2="97" y2="42" stroke="#000" stroke-width="1.5" />
  <text x="99" y="40" font-size="12" font-family="serif">CH<tspan font-size="9" dy="4">2</tspan><tspan dy="-4">OH</tspan></text>
  <!-- HO bottom-left -->
  <line x1="30" y1="88" x2="13" y2="100" stroke="#000" stroke-width="1.5" />
  <text x="2" y="113" font-size="12" font-family="serif">HO</text>
  <!-- Cl bottom-right -->
  <line x1="80" y1="88" x2="97" y2="100" stroke="#000" stroke-width="1.5" />
  <text x="99" y="113" font-size="12" font-family="serif">Cl</text>
</svg>`;

// Q69 vertical branch options
const svgQ69Opt3 = `<div style="display:inline-flex; align-items:center; font-family:monospace; font-weight:bold; font-size:11px;">
  <span style="display:inline-block; text-align:center;">
    CH₃ - CH - CH₂ - CH₃<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Br
  </span>
  <span style="margin-left:10px; font-family:sans-serif; font-size:12px;">&amp; S<sub>N</sub>1</span>
</div>`;

const svgQ69Opt4 = `<div style="display:inline-flex; align-items:center; font-family:monospace; font-weight:bold; font-size:11px;">
  <span style="display:inline-block; text-align:center;">
    CH₃ - CH - CH₂ - CH₃<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Br
  </span>
  <span style="margin-left:10px; font-family:sans-serif; font-size:12px;">&amp; S<sub>N</sub>2</span>
</div>`;

// Q72 Reactant SVGs
const svgQ72React1 = `<div style="display:block; margin:10px auto; font-family:serif; font-size:14px;">
  1) <svg width="240" height="60" style="background:#fff; vertical-align:middle; display:inline-block;">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/>
      </marker>
    </defs>
    <line x1="10" y1="40" x2="30" y2="25" stroke="#000" stroke-width="1.5" />
    <line x1="30" y1="25" x2="50" y2="40" stroke="#000" stroke-width="1.5" />
    <line x1="50" y1="40" x2="70" y2="25" stroke="#000" stroke-width="1.5" />
    <text x="73" y="28" font-size="14" font-family="serif">Cl</text>
    <line x1="100" y1="32" x2="180" y2="32" stroke="#000" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="105" y="22" font-size="12">1. Mg/ether</text>
    <text x="105" y="48" font-size="12">2. H₂O</text>
  </svg>
</div>`;

const svgQ72React2 = `<div style="display:block; margin:10px auto; font-family:serif; font-size:14px;">
  2) <svg width="240" height="60" style="background:#fff; vertical-align:middle; display:inline-block;">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/>
      </marker>
    </defs>
    <line x1="10" y1="40" x2="30" y2="25" stroke="#000" stroke-width="1.5" />
    <line x1="30" y1="25" x2="50" y2="40" stroke="#000" stroke-width="1.5" />
    <line x1="32" y1="21" x2="52" y2="36" stroke="#000" stroke-width="1.5" />
    <line x1="80" y1="32" x2="180" y2="32" stroke="#000" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="85" y="22" font-size="12">1. B₂H₆/ether</text>
    <text x="85" y="48" font-size="12">2. CH₃COOH</text>
  </svg>
</div>`;

const svgQ72React3 = `<div style="display:block; margin:10px auto; font-family:serif; font-size:14px;">
  3) <svg width="240" height="60" style="background:#fff; vertical-align:middle; display:inline-block;">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/>
      </marker>
    </defs>
    <line x1="10" y1="45" x2="30" y2="30" stroke="#000" stroke-width="1.5" />
    <line x1="30" y1="30" x2="50" y2="45" stroke="#000" stroke-width="1.5" />
    <line x1="30" y1="30" x2="30" y2="12" stroke="#000" stroke-width="1.5" />
    <text x="25" y="10" font-size="14" font-family="serif">Cl</text>
    <line x1="70" y1="35" x2="160" y2="35" stroke="#000" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="90" y="25" font-size="13">P + HI</text>
  </svg>
</div>`;

const svgQ72React4 = `<div style="display:block; margin:10px auto; font-family:serif; font-size:14px;">
  4) <svg width="240" height="60" style="background:#fff; vertical-align:middle; display:inline-block;">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/>
      </marker>
    </defs>
    <text x="10" y="45" font-size="14" font-family="serif">Me</text>
    <line x1="32" y1="40" x2="50" y2="28" stroke="#000" stroke-width="1.5" />
    <line x1="48" y1="28" x2="48" y2="12" stroke="#000" stroke-width="1.5" />
    <line x1="52" y1="28" x2="52" y2="12" stroke="#000" stroke-width="1.5" />
    <text x="45" y="10" font-size="14" font-family="serif">O</text>
    <line x1="50" y1="28" x2="68" y2="40" stroke="#000" stroke-width="1.5" />
    <text x="70" y="45" font-size="14" font-family="serif">Cl</text>
    <line x1="95" y1="35" x2="185" y2="35" stroke="#000" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="100" y="25" font-size="12">1. CH₃MgX</text>
    <text x="100" y="50" font-size="12">2. H₂O</text>
  </svg>
</div>`;

const svgQ56Reactant = `<br/><br/>
<svg width="300" height="80" style="display:block; margin:10px auto; background:#fff;">
  <defs>
    <marker id="arrow56" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/>
    </marker>
  </defs>
  <text x="10" y="45" font-size="18" font-family="sans-serif">2-hexene</text>
  <line x1="95" y1="40" x2="195" y2="40" stroke="#000" stroke-width="1.5" marker-end="url(#arrow56)" />
  <!-- (i) O3 -->
  <text x="120" y="25" font-size="16" font-family="serif"><tspan font-style="italic">(i) O</tspan><tspan font-size="12" dy="5">3</tspan></text>
  <!-- (ii) H2O -->
  <text x="115" y="65" font-size="16" font-family="serif"><tspan font-style="italic">(ii) H</tspan><tspan font-size="12" dy="5">2</tspan><tspan font-style="italic" dy="-5">O</tspan></text>
  <text x="205" y="45" font-size="18" font-family="sans-serif">Products</text>
</svg>`;

const svgQ59Reactant = `<br/><br/>
<svg width="450" height="80" style="display:block; margin:10px auto; background:#fff; font-family:serif; font-style:italic;">
  <defs>
    <marker id="arrow59" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/>
    </marker>
  </defs>
  <text x="10" y="45" font-size="18">H - C &#8801; CH</text>
  
  <!-- Arrow 1 -->
  <line x1="115" y1="40" x2="235" y2="40" stroke="#000" stroke-width="1.5" marker-end="url(#arrow59)" />
  <text x="120" y="25" font-size="12">(1) NaNH<tspan font-size="9" dy="4">2</tspan><tspan dy="-4"> / liq. NH</tspan><tspan font-size="9" dy="4">3</tspan></text>
  <text x="140" y="60" font-size="12">(2) CH<tspan font-size="9" dy="4">3</tspan><tspan dy="-4">CH</tspan><tspan font-size="9" dy="4">2</tspan><tspan dy="-4">Br</tspan></text>
  
  <text x="245" y="45" font-size="18">X</text>
  
  <!-- Arrow 2 -->
  <line x1="265" y1="40" x2="385" y2="40" stroke="#000" stroke-width="1.5" marker-end="url(#arrow59)" />
  <text x="270" y="25" font-size="12">(1) NaNH<tspan font-size="9" dy="4">2</tspan><tspan dy="-4"> / liq. NH</tspan><tspan font-size="9" dy="4">3</tspan></text>
  <text x="290" y="60" font-size="12">(2) CH<tspan font-size="9" dy="4">3</tspan><tspan dy="-4">CH</tspan><tspan font-size="9" dy="4">2</tspan><tspan dy="-4">Br</tspan></text>
  
  <text x="395" y="45" font-size="18">Y</text>
</svg>`;

const questionsData = [
    // ── Mathematics MCQs ─────────────────────────────────────────────────────
    {
        subject: 'Mathematics',
        concept: 'Functions',
        type: 'MCQ',
        questionText: 'The range of the function f(x) = 9<sup>x</sup> - 3<sup>x</sup> + 1 is:',
        options: ['[' + frac('1', '3') + ', ∞)', '[' + frac('3', '4') + ', ∞)', '(-∞, ' + frac('3', '4') + ']', '[0,1]'],
        answer: '[' + frac('3', '4') + ', ∞)'
    },
    {
        subject: 'Mathematics',
        concept: 'Relations',
        type: 'MCQ',
        questionText: 'Let W denote the words in the English dictionary. Define the relation R by R = {(x, y) ∈ W × W : the words x and y have at least one letter in common}. Then R is:',
        options: [
            'reflexive, symmetric and transitive',
            'reflexive, not symmetric and transitive',
            'Not reflexive, symmetric and transitive',
            'Reflexive, symmetric and not transitive'
        ],
        answer: 'Reflexive, symmetric and not transitive'
    },
    {
        subject: 'Mathematics',
        concept: 'Functions',
        type: 'MCQ',
        questionText: 'f : N → R such that f(x) = ' + frac('2x - 1', '2') + ' and g : Q → R such that g(x) = x + 2 be two functions. Then (gof)(' + frac('3', '2') + ') is equal to:',
        options: ['3', frac('7', '2'), '1', 'Not defined'],
        answer: '3'
    },
    {
        subject: 'Mathematics',
        concept: 'Functions',
        type: 'MCQ',
        questionText: 'If g(x) = 1 + √x and f(g(x)) = 3 + 2√x + x, then f(x) =',
        options: ['1 + 2x<sup>2</sup>', '2 + x<sup>2</sup>', '1 + x', '2 + x'],
        answer: '2 + x<sup>2</sup>'
    },
    {
        subject: 'Mathematics',
        concept: 'Functions',
        type: 'MCQ',
        questionText: 'If f(x) = cos[e<sup>2</sup>]x + cos[-e<sup>2</sup>]x where [x] stands for greatest integer function, then:',
        options: ['f(π) = 1', 'f(2π) = 1', 'f(' + frac('π', '2') + ') = 1', 'f(' + frac('π', '4') + ') = 1'],
        answer: 'f(' + frac('π', '2') + ') = 1'
    },
    {
        subject: 'Mathematics',
        concept: 'Functions',
        type: 'MCQ',
        questionText: 'If f(x) = ' + frac('(x - a)(x - b)', 'x') + ' and ' + frac('f(x)', '(x - y)(x - z)') + ' + ' + frac('f(y)', '(y - z)(y - x)') + ' + ' + frac('f(z)', '(z - x)(z - y)') + ' = ' + frac('K', 'xyz') + ', then K =',
        options: ['a', 'b', 'ab', '3ab'],
        answer: 'ab'
    },
    {
        subject: 'Mathematics',
        concept: 'Relations',
        type: 'MCQ',
        questionText: 'Let A be the finite set and n(A) = 7, then the number of relations which are not symmetric is:',
        options: [
            '2<sup>28</sup> - 2<sup>15</sup>',
            '2<sup>39</sup> - 2<sup>10</sup>',
            '2<sup>49</sup> - 2<sup>28</sup>',
            '2<sup>49</sup> - 2<sup>39</sup>'
        ],
        answer: '2<sup>49</sup> - 2<sup>28</sup>'
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'In the first box there are tickets marked with numbers 1,2,3,4. In the second box there are tickets marked with numbers 2,4,6,7,8,9. If a box is chosen and a ticket is drawn from it at random, the probability for the number of the ticket to be 2 or 4 is:',
        options: [frac('9', '12'), frac('5', '12'), frac('5', '6'), frac('1', '6')],
        answer: frac('5', '12')
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'An urn contains 5 red and 2 green balls. A ball is drawn at random from the urn. If the drawn ball is green, then a red ball is added to the urn and if the drawn ball is red, then a green ball is added to the urn; the original ball is not returned to the urn. Now, a second ball is drawn at random from it. The probability that the second ball is red, is:',
        options: [frac('32', '49'), frac('17', '49'), frac('15', '49'), frac('36', '49')],
        answer: frac('32', '49')
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'A bag contains 4 red and 6 black balls. A ball is drawn at random from the bag, its colour is observed and this ball along with two additional balls of the same colour are returned to the bag. If a ball is drawn at random from the bag, then the probability that this drawn ball is red, is:',
        options: [frac('2', '5'), frac('1', '5'), frac('3', '4'), frac('3', '10')],
        answer: frac('2', '5')
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'There are three main political parties namely 1, 2 and 3. If in the adjoining table P<sub>ij</sub>, (i, j = 1, 2, 3, .....) denotes the probability that party j wins the general elections contested when party i is in the power. What is the probability that the party 2 will be in power after the next two elections, given that the party 1 is in power?<br/><br/><table border="1" cellpadding="8" style="border-collapse:collapse; margin:10px auto; font-family:sans-serif; text-align:center; min-width:240px; font-weight:500;"><tr><td>P<sub>11</sub> = 0.7</td><td>P<sub>12</sub> = 0.2</td><td>P<sub>13</sub> = 0.1</td></tr><tr><td>P<sub>21</sub> = 0.5</td><td>P<sub>22</sub> = 0.3</td><td>P<sub>23</sub> = 0.2</td></tr><tr><td>P<sub>31</sub> = 0.3</td><td>P<sub>32</sub> = 0.4</td><td>P<sub>33</sub> = 0.3</td></tr></table>',
        options: ['0.28', '0.24', '0.14', '0.06'],
        answer: '0.24'
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'An urn A contains 4 white and 1 black ball; urn B contains 3 white and 2 black balls and urn C contains 2 white and 3 black balls. One ball is transferred randomly from A to B; later one ball is transferred randomly from B to C. Finally, if a ball is drawn randomly from C, then the probability that it is a black ball is:',
        options: [frac('7', '12'), frac('89', '180'), frac('101', '180'), frac('17', '36')],
        answer: frac('101', '180')
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'Two marbles are missing from a box which contains 7 white and 5 black marbles. When two marbles are drawn at random they were found to be white. The probability that the missing marbles are one each in the two colors is:',
        options: [frac('7', '18'), frac('5', '9'), frac('11', '27'), 'None of these'],
        answer: frac('5', '9')
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'A letter is known to have come either from LONDON or CLIFTON; on the postmark only the two consecutive letters ON are legible. The probability that it came from LONDON is:',
        options: [frac('5', '17'), frac('12', '17'), frac('17', '30'), frac('3', '5')],
        answer: frac('12', '17')
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'For k = 1, 2, 3 the box B<sub>k</sub> contains k red balls and (k + 1) white balls. Let P(B₁) = ' + frac('1', '2') + ', P(B₂) = ' + frac('1', '3') + ', P(B₃) = ' + frac('1', '6') + '. A box is selected at random and a ball is drawn from it. If a red ball is drawn, then the probability that it has come from box B₂ is:',
        options: [frac('35', '78'), frac('14', '39'), frac('10', '13'), frac('12', '13')],
        answer: frac('14', '39')
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'A, B, C are three routes from the house to the office. On any day, the route selected by the officer is independent of the climate. On a rainy day, the probabilities of reaching the office late, through these routes are ' + frac('1', '25') + ', ' + frac('1', '10') + ', ' + frac('1', '4') + ' respectively. If on a rainy day, the officer is late to the office, then the probability that the route taken was B is:',
        options: [frac('5', '6'), frac('7', '40'), frac('29', '40'), frac('10', '39')],
        answer: frac('10', '39')
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'Urn A contains 6 red and 4 black balls and urn B contains 4 red and 6 black balls. One ball is drawn at random from urn A and placed in urn B. Then one ball is drawn at random from urn B and placed in urn A. If one ball is now drawn from urn A, the probability that it is found to be red is:',
        options: [frac('32', '55'), frac('42', '55'), frac('36', '55'), 'None'],
        answer: frac('32', '55')
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'A man speaks truth 2 out of 3 times. He picks one of the natural numbers in the set S = {1, 2, 3, 4, 5, 6, 7} and reports that it is even. The probability that it is actually even is:',
        options: [frac('3', '5'), frac('1', '10'), frac('1', '5'), frac('2', '5')],
        answer: frac('3', '5')
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'On a Saturday night, 20% of all drivers in the USA are under the influence of alcohol. The probability that a driver under the influence of alcohol will have an accident is 0.001. The probability that a sober driver will have an accident is 0.0001. If a car on a Saturday night smashed into a tree, then the probability that the driver was under the influence of alcohol is:',
        options: [frac('3', '7'), frac('4', '7'), frac('5', '7'), frac('6', '7')],
        answer: frac('5', '7')
    },
    {
        subject: 'Mathematics',
        concept: 'Probability',
        type: 'MCQ',
        questionText: 'If E<sub>1</sub> and E<sub>2</sub> are two events of a random experiment such that P(E<sub>1</sub>) = ' + frac('1', '8') + ', P(E<sub>1</sub>|E<sub>2</sub>) = ' + frac('1', '3') + ', P(E<sub>2</sub>|E<sub>1</sub>) = ' + frac('1', '4') + ', then match the items of List-I with List-II:<br/><br/><table border="1" cellpadding="8" style="border-collapse:collapse; margin:10px auto; font-family:sans-serif; text-align:left; min-width:320px; font-weight:500;"><thead><tr style="background:#f8fafc;"><th style="padding:10px; border:1px solid #cbd5e1;">List - I</th><th style="padding:10px; border:1px solid #cbd5e1;">List - II</th></tr></thead><tbody><tr><td style="padding:10px; border:1px solid #cbd5e1;">A) P(E<sub>2</sub>)</td><td style="padding:10px; border:1px solid #cbd5e1;">I) ' + frac('3', '16') + '</td></tr><tr><td style="padding:10px; border:1px solid #cbd5e1;">B) P(E<sub>1</sub> ∪ E<sub>2</sub>)</td><td style="padding:10px; border:1px solid #cbd5e1;">II) ' + frac('3', '29') + '</td></tr><tr><td style="padding:10px; border:1px solid #cbd5e1;">C) P(<span style="text-decoration:overline;">E</span><sub>1</sub> | <span style="text-decoration:overline;">E</span><sub>2</sub>)</td><td style="padding:10px; border:1px solid #cbd5e1;">III) ' + frac('3', '32') + '</td></tr><tr><td style="padding:10px; border:1px solid #cbd5e1;">D) P(E<sub>1</sub> | <span style="text-decoration:overline;">E</span><sub>2</sub>)</td><td style="padding:10px; border:1px solid #cbd5e1;">IV) ' + frac('26', '29') + '</td></tr><tr><td style="padding:10px; border:1px solid #cbd5e1;"></td><td style="padding:10px; border:1px solid #cbd5e1;">V) ' + frac('13', '32') + '</td></tr></tbody></table><br/><b>The correct match is:</b>',
        options: [
            'A-I, B-III, C-IV, D-II',
            'A-III, B-I, C-IV, D-V',
            'A-III, B-I, C-IV, D-II',
            'A-I, B-II, C-V, D-IV'
        ],
        answer: 'A-III, B-I, C-IV, D-II'
    },
    // ── Mathematics Numericals ───────────────────────────────────────────────
    {
        subject: 'Mathematics',
        concept: 'Equivalence Relations',
        type: 'numerical',
        questionText: 'The number of equivalence relations that can be defined on the set {a, b, c} is:',
        options: [],
        answer: '5'
    },
    {
        subject: 'Mathematics',
        concept: 'Functions',
        type: 'numerical',
        questionText: 'If f(x) = cos(log x), then find the value of:<br/>f(x²) . f(y²) - ' + frac('1', '2') + ' [ f(x² y²) + f(' + frac('x²', 'y²') + ') ]',
        options: [],
        answer: '0'
    },
    {
        subject: 'Mathematics',
        concept: 'Functions',
        type: 'numerical',
        questionText: 'f : R → R is given by f(x) = ' + frac('a<sup>x</sup>', 'a<sup>x</sup> + √a') + ' ∀ x ∈ R, then find the value of:<br/>f(' + frac('1', '1997') + ') + f(' + frac('2', '1997') + ') + ...... + f(' + frac('1995', '1997') + ') + f(' + frac('1996', '1997') + ')',
        options: [],
        answer: '998'
    },
    {
        subject: 'Mathematics',
        concept: 'Functions',
        type: 'numerical',
        questionText: 'If f : R -> R is defined by f(x) = x² - 3x + 2, and f(x² - 3x - 2) = a x⁴ + b x³ + c x² + d x + e, then find the value of:<br/>a + b + c + d + e',
        options: [],
        answer: '30'
    },
    {
        subject: 'Mathematics',
        concept: 'Functions',
        type: 'numerical',
        questionText: 'If f(x) is a polynomial in x (> 0) satisfying the equation f(x) + f(1/x) = f(x) . f(1/x) and f(2) = 9, then find the value of f(3):',
        options: [],
        answer: '28'
    },
    // ── Physics MCQs ─────────────────────────────────────────────────────────
    {
        subject: 'Physics',
        concept: 'Electrostatics',
        type: 'MCQ',
        questionText: 'A cube of side 1 cm contains 100 molecules each having an induced dipole moment of 0.2 × 10<sup>-6</sup> C-m in an external electric field of 4 NC<sup>-1</sup>. The electric susceptibility of the material is ______ C<sup>2</sup> N<sup>-1</sup> m<sup>-2</sup>:',
        options: ['50', '5', '0.5', '0.05'],
        answer: '50'
    },
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'MCQ',
        questionText: 'At room temperature, copper has free electron density of 8.4 × 10<sup>28</sup> m<sup>-3</sup>. The electron drift velocity in a copper conductor of cross-sectional area of 10<sup>-6</sup> m<sup>2</sup> and carrying a current of 5.4 A will be:',
        options: ['4 m/s', '0.4 m/s', '4 cm/s', '0.4 mm/s'],
        answer: '0.4 mm/s'
    },
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'MCQ',
        questionText: 'I-V characteristic of a copper wire of length L and area of cross-section A is shown in the figure. The slope of the curve becomes:' + svgQ28,
        options: [
            'More if the experiment is performed at higher temperature',
            'More if a wire of steel of same dimension is used',
            'More if the length of the wire is increased',
            'Less if the length of the wire is increased'
        ],
        answer: 'Less if the length of the wire is increased'
    },
    {
        subject: 'Physics',
        concept: 'Electrostatics',
        type: 'MCQ',
        questionText: 'A parallel plate capacitor with air as the dielectric has capacitance C. A slab of dielectric constant K and having the same thickness as the separation between the plates is introduced so as to fill one-fourth of the capacitor as shown in the figure. The new capacitance will be:',
        options: [
            frac('(K + 3) C', '4'),
            frac('(K + 2) C', '4'),
            frac('(K + 1) C', '4'),
            frac('K C', '4')
        ],
        answer: frac('(K + 3) C', '4')
    },
    {
        subject: 'Physics',
        concept: 'Electrostatics',
        type: 'MCQ',
        questionText: 'An electric dipole of dipole moment p is aligned parallel to a uniform electric field E. The work done by external agent to rotate the dipole slowly by 90° from stable equilibrium position is:',
        options: ['pE', '2pE', frac('√3', '2') + ' pE', frac('pE', '2')],
        answer: 'pE'
    },
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'MCQ',
        questionText: 'In a region 10<sup>19</sup> α particles and 10<sup>19</sup> protons move to the left, while 10<sup>19</sup> electrons move to the right per sec. Find the current ' + frac('Δq', 'Δt') + ':',
        options: ['3.2 A towards left', '3.2 A towards right', '6.4 A towards left', '6.4 A towards right'],
        answer: '6.4 A towards left'
    },
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'MCQ',
        questionText: 'The equivalent resistance of the following infinite network of resistances is:' + svgQ32,
        options: [
            'Less than 4 Ω',
            '4 Ω',
            'More than 4 Ω but less than 12 Ω',
            '12 Ω'
        ],
        answer: 'More than 4 Ω but less than 12 Ω'
    },
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'MCQ',
        questionText: 'Two wires of same metal have the same length but their cross-sections are in the ratio 3:1. They are joined in series. The resistance of the thicker wire is 10 Ω. The total resistance of the combination will be:',
        options: ['40 Ω', frac('40', '3') + ' Ω', frac('5', '2') + ' Ω', '100 Ω'],
        answer: '40 Ω'
    },
    {
        subject: 'Physics',
        concept: 'Electrostatics',
        type: 'MCQ',
        questionText: 'A cylindrical capacitor has charge Q and length L. If both the charge and the length of the capacitor are doubled by keeping the other parameters fixed, then the energy stored in the capacitor:',
        options: ['remains same', 'increases two times', 'decreases two times', 'increases four times'],
        answer: 'increases two times'
    },
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'MCQ',
        questionText: 'Four resistances of 15 Ω, 12 Ω, 4 Ω and 10 Ω respectively in cyclic order form a Wheatstone\'s network. The resistance that is to be connected in parallel with the resistance of 10 Ω to balance the network is:',
        options: ['20.00 Ω', '10.00 Ω', '35.00 Ω', '50.00 Ω'],
        answer: '10.00 Ω'
    },
    {
        subject: 'Physics',
        concept: 'Electrostatics',
        type: 'MCQ',
        questionText: 'When a body is earth connected, electrons flow from the body to earth. This means that the body is:',
        options: ['Unchanged', 'Charged Positively', 'Charged negatively', 'An insulator'],
        answer: 'Charged negatively'
    },
    {
        subject: 'Physics',
        concept: 'Electrostatics',
        type: 'MCQ',
        questionText: 'The potential of a large liquid drop when eight liquid drops are combined is 20 V, then the potential of each single drop was:',
        options: ['10 V', '7.5 V', '5 V', '2.5 V'],
        answer: '5 V'
    },
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'MCQ',
        questionText: 'If two bulbs of wattages 25 W and 100 W respectively each rated at 220 V are connected in series with a supply of 440 V, which bulb will fuse?',
        options: ['100 W bulb', '25 W bulb', 'None of them', 'Both of them'],
        answer: '25 W bulb'
    },
    {
        subject: 'Physics',
        concept: 'Electrostatics',
        type: 'MCQ',
        questionText: 'Two charges of equal magnitude q are placed in air at a distance 2a apart and third charge -2q is placed at the midpoint. The potential energy of the system is: (ε<sub>0</sub> = permittivity of free space)',
        options: [
            '- ' + frac('q<sup>2</sup>', '8πε<sub>0</sub>a'),
            '- ' + frac('3q<sup>2</sup>', '8πε<sub>0</sub>a'),
            '- ' + frac('5q<sup>2</sup>', '8πε<sub>0</sub>a'),
            '- ' + frac('7q<sup>2</sup>', '8πε<sub>0</sub>a')
        ],
        answer: '- ' + frac('7q<sup>2</sup>', '8πε<sub>0</sub>a')
    },
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'MCQ',
        questionText: 'Two wires of the same metal have the same length, but their cross sections are in the ratio 3:1. They are joined in series. The resistance of the thicker wire is 10 Ω. The total resistance of the combination will be:',
        options: [frac('5', '2') + ' Ω', frac('40', '3') + ' Ω', '40 Ω', '100 Ω'],
        answer: '40 Ω'
    },
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'MCQ',
        questionText: 'A piece of fuse wire is about to melt when the current passing through it is 5 A. When carrying this current, it dissipates 2.5 J of energy per second. What is the resistance of the fuse wire?',
        options: ['0.5 Ω', '10 Ω', '0.1 Ω', '2 Ω'],
        answer: '0.1 Ω'
    },
    {
        subject: 'Physics',
        concept: 'Electrostatics',
        type: 'MCQ',
        questionText: 'Two charges of +10 μC and +20 μC are separated by a distance of 2 cm. The net potential (electric) due to the pair at the midpoint of the line joining the two charges is:',
        options: ['27 MV', '18 MV', '20 MV', '23 MV'],
        answer: '27 MV'
    },
    {
        subject: 'Physics',
        concept: 'Electrostatics',
        type: 'MCQ',
        questionText: 'The extent of polarisation depends on:<br/>(1) the dipole potential energy in the external field tending to align the dipoles with the field<br/>(2) thermal energy tending to disrupt the alignment',
        options: [
            'the dipole potential energy in the external field tending to align the dipoles with the field',
            'thermal energy tending to disrupt the alignment',
            'Both (1) and (2)',
            'Neither (1) nor (2)'
        ],
        answer: 'Both (1) and (2)'
    },
    {
        subject: 'Physics',
        concept: 'Electrostatics',
        type: 'MCQ',
        questionText: 'Electric field in a region is increasing in magnitude along the x-direction. The equipotential surfaces associated are:',
        options: [
            'Planes parallel to xy-plane',
            'Planes parallel to yz-plane',
            'Co-axial cylinders around x-axis',
            'All of the above'
        ],
        answer: 'Planes parallel to yz-plane'
    },
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'MCQ',
        questionText: 'In a house there are four bulbs each of 50 W and five fans each of 60 W. They are used at the rate of 6 hours a day. If each unit cost is 2.5 rupees, then the power bill for the month of June is:',
        options: ['₹ 90', '₹ 225', '₹ 180', '₹ 45'],
        answer: '₹ 225'
    },
    // ── Physics Numericals ───────────────────────────────────────────────────
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'numerical',
        questionText: 'A wire of length 5 m and radius 1 mm has a resistance of 1 Ω. What length of the wire of the same material at the same temperature and of radius 2 mm will also have a resistance of 1 Ω? (Enter value in meters)',
        options: [],
        answer: '20'
    },
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'numerical',
        questionText: 'A carbon resistor has colour strips as violet, yellow, brown and golden. The resistance is: (Enter value in ohms)',
        options: [],
        answer: '740'
    },
    {
        subject: 'Physics',
        concept: 'Current Electricity',
        type: 'numerical',
        questionText: 'The resistance of a resistance thermometer has values 2.70 Ω and 3.70 Ω at 0°C and 100°C respectively. The temperature at which the resistance is 3.10 Ω is: (Enter value in °C)',
        options: [],
        answer: '40'
    },
    {
        subject: 'Physics',
        concept: 'Electrostatics',
        type: 'numerical',
        questionText: 'A 4 μF capacitor and a resistance of 2.5 MΩ are in series with a 12 V battery. Find the time after which the potential difference across the capacitor is 3 times the potential difference across the resistor. [Given ln(2) = 0.693] (Enter value in seconds)',
        options: [],
        answer: '14'
    },
    {
        subject: 'Physics',
        concept: 'Electrostatics',
        type: 'numerical',
        questionText: 'When two identical capacitors are in series they have equivalent capacitance of 3 μF, and when in parallel, 12 μF. What is the capacitance of each capacitor? (Enter value in μF)',
        options: [],
        answer: '6'
    },
    // ── Chemistry MCQs ───────────────────────────────────────────────────────
    {
        subject: 'Chemistry',
        concept: 'Organic Chemistry',
        type: 'MCQ',
        questionText: 'Y is' + svgQ51,
        options: [svgQ51Opt1, svgQ51Opt2, svgQ51Opt3, svgQ51Opt4],
        answer: svgQ51Opt3
    },
    {
        subject: 'Chemistry',
        concept: 'Organic Chemistry',
        type: 'MCQ',
        questionText: 'The major product of the following reaction is' + svgQ52Reactant,
        options: [svgQ52Opt1, svgQ52Opt2, svgQ52Opt3, svgQ52Opt4],
        answer: svgQ52Opt1
    },
    {
        subject: 'Chemistry',
        concept: 'Haloalkanes',
        type: 'MCQ',
        questionText: 'In order to prepare 1-chloropropane, which of the following reactants can be employed?',
        options: [
            'Propene and HCl in presence of peroxide',
            'Propene and Cl<sub>2</sub> followed by treatment with aq. KOH',
            'Propanol-1 and SOCl<sub>2</sub> / pyridine',
            'Any of the above'
        ],
        answer: 'Propanol-1 and SOCl<sub>2</sub> / pyridine'
    },
    {
        subject: 'Chemistry',
        concept: 'Organic Chemistry',
        type: 'MCQ',
        questionText: 'Which of the following is not the product of dehydration of' + svgQ54Reactant,
        options: [svgQ54Opt1, svgQ54Opt2, svgQ54Opt3, svgQ54Opt4],
        answer: svgQ54Opt4
    },
    {
        subject: 'Chemistry',
        concept: 'Alkenes',
        type: 'MCQ',
        questionText: 'An alkene X on ozonolysis gives a mixture of simplest ketone (Y) and 3-Pentanone. The IUPAC name of the alkene X is:',
        options: [
            '2,3-Dimethylbut-2-ene',
            '3-Ethyl-4-methylpent-3-ene',
            '3-Ethyl-2-methylpent-2-ene',
            '2-Methyl-3-ethylpent-2-ene'
        ],
        answer: '3-Ethyl-2-methylpent-2-ene'
    },
    {
        subject: 'Chemistry',
        concept: 'Alkenes',
        type: 'MCQ',
        questionText: svgQ56Reactant + '<br/>The two products formed in the above reaction are:',
        options: [
            'Butanal and acetaldehyde',
            'Butanoic acid and acetaldehyde',
            'Butanal and acetic acid',
            'Butanoic acid and acetic acid'
        ],
        answer: 'Butanal and acetaldehyde'
    },
    {
        subject: 'Chemistry',
        concept: 'Alkenes',
        type: 'MCQ',
        questionText: 'Peroxide effect is observed with the addition of HBr but not with the addition of HI to unsymmetrical alkene because:',
        options: [
            'H-I bond is stronger than H-Br and is not cleaved by the free radical',
            'H-I bond is weaker than H-Br bond so that iodine free radicals combine to form iodine molecules',
            'Bond strength of HI and HBr are same but free radicals are formed in HBr',
            'All of these'
        ],
        answer: 'H-I bond is weaker than H-Br bond so that iodine free radicals combine to form iodine molecules'
    },
    {
        subject: 'Chemistry',
        concept: 'Alkynes',
        type: 'MCQ',
        questionText: 'The number of π-bonds in the product formed by passing acetylene through dilute sulphuric acid containing mercuric sulphate is:',
        options: ['Zero', 'One', 'Two', 'Three'],
        answer: 'One'
    },
    {
        subject: 'Chemistry',
        concept: 'Alkynes',
        type: 'MCQ',
        questionText: 'In the reaction:' + svgQ59Reactant + '<br/>X and Y are:',
        options: [
            'X = 1-Butyne ; Y = 2-Hexyne',
            'X = 1-Butyne ; Y = 3-Hexyne',
            'X = 2-Butyne ; Y = 3-Hexyne',
            'X = 2-Butyne ; Y = 2-Hexyne'
        ],
        answer: 'X = 1-Butyne ; Y = 3-Hexyne'
    },
    {
        subject: 'Chemistry',
        concept: 'Alkynes',
        type: 'MCQ',
        questionText: 'The following reaction given below' + svgQ60Reactant + '<br/>X (main), here \'X\' is',
        options: [svgQ60Opt1, svgQ60Opt2, svgQ60Opt3, svgQ60Opt4],
        answer: svgQ60Opt2
    },
    {
        subject: 'Chemistry',
        concept: 'Alkanes',
        type: 'MCQ',
        questionText: 'In the following reaction, the major product obtained is' + svgQ61Reactant,
        options: [svgQ61Opt1, svgQ61Opt2, svgQ61Opt3, svgQ61Opt4],
        answer: svgQ61Opt3
    },
    {
        subject: 'Chemistry',
        concept: 'Alkanes',
        type: 'MCQ',
        questionText: 'Identify the chain termination step during chlorination of methane',
        options: [
            '<i>ĊH<sub>3</sub> + Ċl &rarr; CH<sub>3</sub>Cl</i>',
            '<i>CH<sub>3</sub>Cl + Ċl &rarr; ĊH<sub>2</sub>Cl + HCl</i>',
            '<i>Cl - Cl </i><span style="display:inline-block; text-align:center; vertical-align:middle; font-size:10px; margin:0 5px;"><div style="border-bottom:1px solid #000; padding:0 2px;"><i>h&nu;</i></div><div style="font-style:normal;">homolysis</div></span> &rarr; <i>Ċl + Ċl</i>',
            '<i>ĊH<sub>2</sub>Cl + Cl<sub>2</sub> &rarr; CH<sub>2</sub>Cl<sub>2</sub> + Ċl</i>'
        ],
        answer: '<i>ĊH<sub>3</sub> + Ċl &rarr; CH<sub>3</sub>Cl</i>'
    },
    {
        subject: 'Chemistry',
        concept: 'Alkanes',
        type: 'MCQ',
        questionText: '2-methylpropane on oxidation with alkaline KMnO<sub>4</sub> gives:',
        options: [
            '2-methylpropan-2-ol',
            '2-methylpropan-1-ol',
            'Butane',
            'Butanol-1'
        ],
        answer: '2-methylpropan-2-ol'
    },
    {
        subject: 'Chemistry',
        concept: 'Alkanes',
        type: 'MCQ',
        questionText: 'Which of the following is a controlled oxidation reaction?<br/><br/><div style="font-family:serif; font-size:15px; line-height:1.8;"><b>A.</b> <i>CH<sub>4(g)</sub> + 2O<sub>2(g)</sub> &rarr; CO<sub>2(g)</sub> + H<sub>2</sub>O<sub>(l)</sub></i><br/><b>B.</b> <i>CH<sub>4(g)</sub> + O<sub>2(g)</sub> &rarr; CO<sub>(s)</sub> + H<sub>2</sub>O<sub>(l)</sub></i><br/><b>C.</b> <i>CH<sub>4(g)</sub> + O<sub>2(g)</sub> <svg width="50" height="24" style="display: inline-block; vertical-align:middle; margin:0 5px;"><line x1="0" y1="18" x2="45" y2="18" stroke="#000" stroke-width="1"/><polygon points="45,18 40,15 40,21" fill="#000"/><text x="25" y="12" text-anchor="middle" font-size="11" font-family="serif" font-style="italic">Mn₂O₃</text></svg> HCHO + H<sub>2</sub>O<sub>(l)</sub></i><br/><b>D.</b> <i>CH<sub>4(g)</sub> + O<sub>2(g)</sub> <svg width="100" height="24" style="display: inline-block; vertical-align:middle; margin:0 5px;"><line x1="0" y1="18" x2="95" y2="18" stroke="#000" stroke-width="1"/><polygon points="95,18 90,15 90,21" fill="#000"/><text x="47" y="12" text-anchor="middle" font-size="11" font-family="serif" font-style="italic">Cu/523 K/100 atm</text></svg> 2CH<sub>3</sub>OH<sub>(l)</sub></i></div>',
        options: [
            'Only D',
            'Both A &B',
            'B, C, D only',
            'Both C & D'
        ],
        answer: 'Both C & D'
    },
    {
        subject: 'Chemistry',
        concept: 'Alkanes',
        type: 'MCQ',
        questionText: 'Excess of isobutane on reaction with Br₂ in the presence of light at 125°C gives which one of the following, as the major product?',
        options: [svgQ65Opt1, svgQ65Opt2, svgQ65Opt3, svgQ65Opt4],
        answer: svgQ65Opt4
    },
    {
        subject: 'Chemistry',
        concept: 'Alkanes',
        type: 'MCQ',
        questionText: 'The number of bromo derivatives obtained on treating ethane with excess of Br₂ in diffused sunlight is:',
        options: ['9', '5', '7', '8'],
        answer: '9'
    },
    {
        subject: 'Chemistry',
        concept: 'Haloalkanes',
        type: 'MCQ',
        questionText: 'The IUPAC name of ethylene dichloride is:',
        options: [
            '1,2-dichloroethene',
            '1,1-dichloroethene',
            '1,2-dichloroethane',
            '1,1-dichloroethane'
        ],
        answer: '1,2-dichloroethane'
    },
    {
        subject: 'Chemistry',
        concept: 'Haloalkanes',
        type: 'MCQ',
        questionText: 'Here \'P\' is' + svgQ68Reactant,
        options: [svgQ68Opt1, svgQ68Opt2, svgQ68Opt3, svgQ68Opt4],
        answer: svgQ68Opt2
    },
    {
        subject: 'Chemistry',
        concept: 'Haloalkanes',
        type: 'MCQ',
        questionText: '<i>CH<sub>3</sub>(CH<sub>2</sub>)<sub>2</sub>CH<sub>2</sub>OH <span style="display:inline-block; text-align:center; vertical-align:middle; font-size:12px; margin:0 5px;"><div style="padding:0 2px;">NaBr, H<sub>2</sub>SO<sub>4</sub></div><div>&rarr;</div></span> X</i><br/>Identify \'X\' and the mechanism of the reaction',
        options: [
            '<div style="font-family:serif; font-size:14px;">CH<sub>3</sub> - CH<sub>2</sub> - CH<sub>2</sub> - CH<sub>2</sub> - Br<br/>&amp; SN<sup>1</sup></div>',
            '<div style="font-family:serif; font-size:14px;">CH<sub>3</sub> - CH<sub>2</sub> - CH<sub>2</sub> - CH<sub>2</sub> - Br<br/>&amp; SN<sup>2</sup></div>',
            '<div style="font-family:serif; font-size:14px; display:inline-block; vertical-align:middle;">CH<sub>3</sub> - CH - CH<sub>2</sub> - CH<sub>3</sub><br/><span style="display:inline-block; width:65px;"></span>|<br/><span style="display:inline-block; width:62px;"></span>Br</div> <span style="font-family:serif; font-size:14px;">&amp; S<sub>N</sub>1</span>',
            '<div style="font-family:serif; font-size:14px; display:inline-block; vertical-align:middle;">CH<sub>3</sub> - CH - CH<sub>2</sub> - CH<sub>3</sub><br/><span style="display:inline-block; width:65px;"></span>|<br/><span style="display:inline-block; width:62px;"></span>Br</div> <span style="font-family:serif; font-size:14px;">&amp; SN<sup>2</sup></span>'
        ],
        answer: '<div style="font-family:serif; font-size:14px;">CH<sub>3</sub> - CH<sub>2</sub> - CH<sub>2</sub> - CH<sub>2</sub> - Br<br/>&amp; SN<sup>2</sup></div>'
    },
    {
        subject: 'Chemistry',
        concept: 'Haloalkanes',
        type: 'MCQ',
        questionText: 'Match the following in Column-I with Column-II:<br/><br/><table border="1" cellpadding="8" style="border-collapse:collapse; margin:10px auto; font-family:sans-serif; text-align:left; min-width:320px; font-weight:500;"><thead><tr style="background:#f8fafc;"><th style="padding:10px; border:1px solid #cbd5e1;">Column-I</th><th style="padding:10px; border:1px solid #cbd5e1;">Column-II</th></tr></thead><tbody><tr><td style="padding:10px; border:1px solid #cbd5e1; font-family:\'Times New Roman\', Times, serif;">A. CH<sub>3</sub>COOAg →<br/>CH<sub>3</sub>COOCH<sub>3</sub></td><td style="padding:10px; border:1px solid #cbd5e1; font-family:\'Times New Roman\', Times, serif;">(p) Br<sub>2</sub>, CCl<sub>4</sub></td></tr><tr><td style="padding:10px; border:1px solid #cbd5e1; font-family:\'Times New Roman\', Times, serif;">B. CH<sub>3</sub>CH = CH<sub>2</sub> →<br/>BrCH<sub>2</sub>CH = CH<sub>2</sub></td><td style="padding:10px; border:1px solid #cbd5e1; font-family:\'Times New Roman\', Times, serif;">(q) I<sub>2</sub></td></tr><tr><td style="padding:10px; border:1px solid #cbd5e1; font-family:\'Times New Roman\', Times, serif;">C. CH<sub>3</sub>CH<sub>2</sub>Cl →<br/>CH<sub>3</sub>CH<sub>2</sub>F</td><td style="padding:10px; border:1px solid #cbd5e1; font-family:\'Times New Roman\', Times, serif;">(r) NBS</td></tr><tr><td style="padding:10px; border:1px solid #cbd5e1; font-family:\'Times New Roman\', Times, serif;">D. C<sub>6</sub>H<sub>5</sub>COOAg →<br/>C<sub>6</sub>H<sub>5</sub>Br</td><td style="padding:10px; border:1px solid #cbd5e1; font-family:\'Times New Roman\', Times, serif;">(s) Hg<sub>2</sub>F<sub>2</sub></td></tr></tbody></table><br/><b>The correct match is:</b>',
        options: [
            'A-r, B-s, C-p, D-q',
            'A-q, B-s, C-r, D-p',
            'A-p, B-r, C-s, D-q',
            'A-q, B-r, C-s, D-p'
        ],
        answer: 'A-q, B-r, C-s, D-p'
    },
    // ── Chemistry Numericals ─────────────────────────────────────────────────
    {
        subject: 'Chemistry',
        concept: 'Haloalkanes',
        type: 'numerical',
        questionText: 'The number of geminal dihalides possible with the molecular formula C<sub>4</sub>H<sub>8</sub>Br<sub>2</sub> is:',
        options: [],
        answer: '3'
    },
    {
        subject: 'Chemistry',
        concept: 'Alkanes',
        type: 'numerical',
        questionText: 'How many of the following reactions will not give propane?<br/><br/>' + svgQ72React1 + svgQ72React2 + svgQ72React3 + svgQ72React4,
        options: [],
        answer: '1'
    },
    {
        subject: 'Chemistry',
        concept: 'Haloalkanes',
        type: 'numerical',
        questionText: 'How many primary halides (excluding stereoisomers) are possible for the molecular formula C<sub>5</sub>H<sub>11</sub>Br?',
        options: [],
        answer: '4'
    },
    {
        subject: 'Chemistry',
        concept: 'Alkanes',
        type: 'numerical',
        questionText: 'Find the number of structural isomers (monochlorination products) obtained when 2,6-dimethylheptane is subjected to monochlorination:',
        options: [],
        answer: '4'
    },
    {
        subject: 'Chemistry',
        concept: 'Stoichiometry',
        type: 'numerical',
        questionText: 'Formation of polyethylene from calcium carbide takes place as follows:<br/><br/>CaC<sub>2</sub> + 2H<sub>2</sub>O → Ca(OH)<sub>2</sub> + C<sub>2</sub>H<sub>2</sub><br/>C<sub>2</sub>H<sub>2</sub> + H<sub>2</sub> → C<sub>2</sub>H<sub>4</sub><br/>n(C<sub>2</sub>H<sub>4</sub>) → (-CH<sub>2</sub> - CH<sub>2</sub>-)_n<br/><br/>The amount of polyethylene obtained from 64.1 kg CaC<sub>2</sub> is: (Enter value in kg)',
        options: [],
        answer: '28'
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        // Clean existing mock data
        await Question.deleteMany({ chapter: CHAPTER });
        await OnlineExam.deleteMany({ title: 'II PU JFT JEE MAINS WT-9' });
        console.log('Cleaned old JEE WT-9 questions and exams.');

        // Insert new Questions
        const questionsToInsert = questionsData.map((q, index) => ({
            ...q,
            chapter: CHAPTER,
            questionId: `Q-JEE-WT9-${index + 1}-${Date.now()}`,
            classes: ['12', 'JEE'],
            level: 'medium'
        }));

        const insertedQuestions = await Question.insertMany(questionsToInsert);
        console.log(`Inserted ${insertedQuestions.length} questions.`);

        // Map to OnlineExam questions
        const examQuestions = insertedQuestions.map(q => ({
            questionId: q._id,
            subject: q.subject,
            chapter: q.chapter,
            concept: q.concept,
            questionText: q.questionText,
            options: q.options,
            answer: q.answer,
            imageUrl: q.imageUrl || '',
            marks: 4,
            type: q.type
        }));

        const mockExam = new OnlineExam({
            title: 'II PU JFT JEE MAINS WT-9',
            examType: 'JEE',
            questions: examQuestions,
            instructions: `General Instructions for II PU JFT JEE MAINS WT-9:\n1. The exam contains 75 questions covering Physics, Chemistry, and Mathematics.\n2. There are 60 Multiple Choice Questions (MCQ) and 15 Numerical Value Questions.\n3. For numerical value questions, enter your answer using the keyboard or virtual keypad.\n4. Marking Scheme: +4 for Correct answer, -1 for Incorrect answer, 0 for Unattempted.\n5. Click 'SAVE & NEXT' to save your response.`,
            duration_minutes: 180,
            status: 'live',
            start_time: new Date(),
            end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Live for 30 days
        });

        await mockExam.save();
        console.log('Successfully created live "II PU JFT JEE MAINS WT-9" exam!');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

seed();
