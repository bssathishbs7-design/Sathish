import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/** Render a genuine PDF with an installed local Chrome/Edge; no external upload. */
export async function pdfDocument(html, directory) {
  const candidates = [process.env.MEDSY_PDF_BROWSER, path.join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'), path.join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe'), '/usr/bin/chromium', '/usr/bin/google-chrome'];
  const browser = candidates.find(file => file && fs.existsSync(file));
  if (!browser) throw Error('PDF export requires installed Chrome or Edge. Configure MEDSY_PDF_BROWSER or download Word.');
  const base = path.resolve(directory, 'pdf-temp'); fs.mkdirSync(base, { recursive: true });
  const folder = fs.mkdtempSync(path.join(base, 'export-'));
  const input = path.join(folder, 'report.html'), output = path.join(folder, 'report.pdf');
  fs.writeFileSync(input, html);
  let child;
  try {
    await new Promise((resolve, reject) => {
      child = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--no-pdf-header-footer', '--user-data-dir='+path.join(folder,'profile'), '--print-to-pdf='+output, pathToFileURL(input).href], { windowsHide: true, stdio: 'ignore' });
      const timer = setTimeout(() => { child.kill(); reject(Error('PDF export timed out. Retry or download Word.')); }, 45000);
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', code => { clearTimeout(timer); code === 0 && fs.existsSync(output) ? resolve() : reject(Error('PDF rendering failed. Download Word or check the local browser installation.')); });
    });
    return fs.readFileSync(output);
  } finally {
    if (path.resolve(folder).startsWith(base + path.sep)) {
      try { fs.rmSync(folder, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch { /* A locked browser profile can be removed after the browser exits. */ }
    }
  }
}
