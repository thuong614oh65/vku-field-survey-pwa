const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function mdToHtml(md) {
  let html = md
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold / Italic
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr/>')
    // Inline code
    .replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Simple table parser
  const lines = html.split('\n');
  let inTable = false;
  let tableHtml = '';
  const resultLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (line.includes('---')) {
        continue; // delimiter row
      }
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      if (!inTable) {
        inTable = true;
        tableHtml = '<table><thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
      } else {
        tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
      }
    } else {
      if (inTable) {
        inTable = false;
        tableHtml += '</tbody></table>';
        resultLines.push(tableHtml);
      }
      if (line.startsWith('```')) {
        resultLines.push(line.replace(/```[a-z]*/g, '<pre><code>'));
      } else if (line === '```') {
        resultLines.push('</code></pre>');
      } else if (line.length > 0 && !line.startsWith('<h') && !line.startsWith('<hr')) {
        resultLines.push(`<p>${line}</p>`);
      } else {
        resultLines.push(line);
      }
    }
  }
  if (inTable) {
    resultLines.push(tableHtml + '</tbody></table>');
  }

  return resultLines.join('\n');
}

const mdPath = path.join(__dirname, 'BAO_CAO_KY_THUAT_REPORT.md');
const mdContent = fs.readFileSync(mdPath, 'utf-8');
const bodyContent = mdToHtml(mdContent);

const htmlTemplate = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo Cáo Kỹ Thuật - VKU Field Survey</title>
  <style>
    @page { size: A4; margin: 16mm 18mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.55;
      font-size: 13px;
      margin: 0;
      padding: 0;
    }
    h1 { font-size: 20px; color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-top: 0; }
    h2 { font-size: 16px; color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 18px; }
    h3 { font-size: 14px; color: #1e293b; margin-top: 12px; }
    p { margin: 6px 0; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 14px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
    th { background: #f1f5f9; color: #0f172a; font-weight: 700; border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }
    td { border: 1px solid #cbd5e1; padding: 6px 10px; }
    tr:nth-child(even) { background: #f8fafc; }
    code { background: #f1f5f9; color: #0369a1; padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 11.5px; }
    pre { background: #0f172a; color: #f8fafc; padding: 10px 14px; border-radius: 8px; overflow-x: auto; font-size: 11.5px; }
    pre code { background: none; color: inherit; padding: 0; }
    a { color: #0284c7; text-decoration: none; font-weight: 600; }
    strong { color: #0f172a; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;

const tempHtml = path.join(__dirname, 'temp_report.html');
fs.writeFileSync(tempHtml, htmlTemplate, 'utf-8');

const pdfOut = path.join(__dirname, 'BAO_CAO_KY_THUAT_REPORT.pdf');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

console.log('Rendering PDF via Microsoft Edge...');
execSync(`"${edgePath}" --headless --disable-gpu --print-to-pdf="${pdfOut}" --no-pdf-header-footer "${tempHtml}"`);

if (fs.existsSync(tempHtml)) {
  fs.unlinkSync(tempHtml);
}

console.log(`✓ PDF Generated Successfully: ${pdfOut}`);
