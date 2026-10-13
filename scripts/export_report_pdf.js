const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const projectRoot = path.resolve(__dirname, '..');
const mdPath = path.join(projectRoot, 'docs', 'project_report.md');
const pdfPath = path.join(projectRoot, 'docs', 'project_report.pdf');
const htmlTempPath = path.join(projectRoot, 'docs', 'temp_report.html');

if (!fs.existsSync(mdPath)) {
  console.error('project_report.md does not exist at:', mdPath);
  process.exit(1);
}

const mdContent = fs.readFileSync(mdPath, 'utf8');

function markdownToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let inTable = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Table handling
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        if (inList) { out.push('</ul>'); inList = false; }
        inTable = true;
        out.push('<table>');
      }
      if (line.includes('---')) continue;
      const cols = line.split('|').slice(1, -1);
      const isHeader = !out.some(l => l.includes('<tbody>'));
      if (isHeader) {
        out.push('<thead><tr>' + cols.map(c => `<th>${c.trim()}</th>`).join('') + '</tr></thead><tbody>');
      } else {
        out.push('<tr>' + cols.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>');
      }
      continue;
    } else if (inTable) {
      inTable = false;
      out.push('</tbody></table>');
    }

    // List handling
    if (line.match(/^[-*]\s+(.*)$/)) {
      if (!inList) {
        inList = true;
        out.push('<ul>');
      }
      const item = line.replace(/^[-*]\s+/, '');
      out.push(`<li>${formatInline(item)}</li>`);
      continue;
    } else if (line.match(/^\d+\.\s+(.*)$/)) {
      if (!inList) {
        inList = true;
        out.push('<ol>');
      }
      const item = line.replace(/^\d+\.\s+/, '');
      out.push(`<li>${formatInline(item)}</li>`);
      continue;
    } else if (inList && line.trim() === '') {
      inList = false;
      out.push('</ul>');
    }

    // Headers
    if (line.startsWith('# ')) {
      out.push(`<h1>${formatInline(line.substring(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      out.push(`<h2>${formatInline(line.substring(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      out.push(`<h3>${formatInline(line.substring(4))}</h3>`);
    } else if (line.startsWith('#### ')) {
      out.push(`<h4>${formatInline(line.substring(5))}</h4>`);
    } else if (line.trim() === '---') {
      out.push('<hr/>');
    } else if (line.trim().length > 0) {
      out.push(`<p>${formatInline(line)}</p>`);
    }
  }

  if (inTable) out.push('</tbody></table>');
  if (inList) out.push('</ul>');

  return out.join('\n');
}

function formatInline(str) {
  return str
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

const bodyHtml = markdownToHtml(mdContent);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>SwapThread - Comprehensive Internship Project Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 40px auto;
      max-width: 900px;
      padding: 0 40px;
      background: #ffffff;
    }
    h1 { font-size: 26px; color: #0f172a; border-bottom: 2px solid #2f6b4f; padding-bottom: 8px; margin-top: 36px; }
    h2 { font-size: 19px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 28px; }
    h3 { font-size: 15px; color: #334155; margin-top: 20px; font-weight: 700; }
    h4 { font-size: 13.5px; color: #475569; margin-top: 14px; font-weight: 600; }
    p, li { font-size: 13px; color: #334155; margin-bottom: 6px; }
    ul, ol { padding-left: 22px; margin-bottom: 12px; }
    code { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 12px; }
    th { background: #f8fafc; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 600; color: #0f172a; }
    td { padding: 7px 10px; border: 1px solid #e2e8f0; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
    a { color: #2f6b4f; text-decoration: none; }
    @page { margin: 18mm; size: A4; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

fs.writeFileSync(htmlTempPath, html);

try {
  console.log('Generating PDF via Google Chrome...');
  execSync(`"${CHROME_PATH}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlTempPath}"`);
  const stats = fs.statSync(pdfPath);
  console.log(`✔ Successfully generated: ${pdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error('Error generating PDF:', err.message);
  process.exit(1);
} finally {
  if (fs.existsSync(htmlTempPath)) {
    fs.unlinkSync(htmlTempPath);
  }
}
