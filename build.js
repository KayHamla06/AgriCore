/* ============================================
   AgriCore — Build Script
   Minifies JS & CSS for production to reduce
   code exposure in the browser.
   Run: node build.js
   ============================================ */

const fs = require('fs');
const path = require('path');

const JS_DIR = path.join(__dirname, 'js');
const CSS_DIR = path.join(__dirname, 'css');
const DIST_DIR = path.join(__dirname, 'dist');
const DIST_JS = path.join(DIST_DIR, 'js');
const DIST_CSS = path.join(DIST_DIR, 'css');

// =============================================
//  SIMPLE MINIFIERS (no dependencies)
// =============================================

function minifyJS(code) {
  // 1. Extract strings AND remove comments in a single pass.
  //    Strings are matched first so quotes inside comments aren't misinterpreted.
  const strings = [];
  const placeholder = (i) => `__STR${i}__`;

  const extracted = code.replace(
    /`(?:[^`\\]|\\.|\$\{[^}]*\})*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/.*$|\/\*[\s\S]*?\*\//gm,
    (match) => {
      if (match.startsWith('//') || match.startsWith('/*')) return '';
      const i = strings.length;
      strings.push(match);
      return placeholder(i);
    }
  );

  // 2. Minify the code (string contents are safe behind placeholders)
  let result = extracted
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    // Remove spaces around operators and braces
    .replace(/\s*([{}();,=<>!&|+\-*/%:?])\s*/g, '$1')
    // Remove spaces after opening and before closing brackets
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\{\s+/g, '{')
    .replace(/\s+\}/g, '}')
    .replace(/;\s+/g, ';')
    .replace(/,\s+/g, ',')
    // Trim
    .trim();

  // 3. Restore string literals
  for (let i = 0; i < strings.length; i++) {
    result = result.replace(placeholder(i), strings[i]);
  }

  return result;
}

function minifyCSS(code) {
  return code
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    // Remove spaces around special characters
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    // Remove last semicolons before closing brace
    .replace(/;}/g, '}')
    // Trim
    .trim();
}

// =============================================
//  GATHER FILES RECURSIVELY
// =============================================

function getFiles(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...getFiles(fullPath, ext));
    } else if (item.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

// =============================================
//  BUILD
// =============================================

function build() {
  console.log('AgriCore Build — Minifying for production...\n');

  // Clean dist
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }

  // Create dist directories
  fs.mkdirSync(DIST_JS, { recursive: true });
  fs.mkdirSync(DIST_CSS, { recursive: true });

  // Minify JS
  const jsFiles = getFiles(JS_DIR, '.js');
  let totalJsSaved = 0;
  for (const file of jsFiles) {
    const relative = path.relative(JS_DIR, file);
    const outPath = path.join(DIST_JS, relative);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    const original = fs.readFileSync(file, 'utf8');
    const minified = minifyJS(original);
    fs.writeFileSync(outPath, minified);

    const saved = original.length - minified.length;
    totalJsSaved += saved;
    const pct = ((saved / original.length) * 100).toFixed(1);
    console.log(`  JS  ${relative.padEnd(40)} ${(original.length / 1024).toFixed(1)}KB → ${(minified.length / 1024).toFixed(1)}KB  (-${pct}%)`);
  }

  // Minify CSS
  const cssFiles = getFiles(CSS_DIR, '.css');
  let totalCssSaved = 0;
  for (const file of cssFiles) {
    const relative = path.relative(CSS_DIR, file);
    const outPath = path.join(DIST_CSS, relative);

    const original = fs.readFileSync(file, 'utf8');
    const minified = minifyCSS(original);
    fs.writeFileSync(outPath, minified);

    const saved = original.length - minified.length;
    totalCssSaved += saved;
    const pct = ((saved / original.length) * 100).toFixed(1);
    console.log(`  CSS ${relative.padEnd(40)} ${(original.length / 1024).toFixed(1)}KB → ${(minified.length / 1024).toFixed(1)}KB  (-${pct}%)`);
  }

  // Copy HTML files (no minification, they're served by routes)
  const htmlFiles = ['index.html', 'login.html', 'signup.html', 'dashboard.html', 'admin.html', 'terms.html', 'verify.html', 'auth-callback.html', 'pending-verification.html', 'reset-password.html'];
  for (const file of htmlFiles) {
    const src = path.join(__dirname, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST_DIR, file));
      console.log(`  HTML ${file.padEnd(39)} copied`);
    }
  }

  // Copy assets
  const assetsDir = path.join(__dirname, 'assets');
  const distAssets = path.join(DIST_DIR, 'assets');
  if (fs.existsSync(assetsDir)) {
    fs.mkdirSync(distAssets, { recursive: true });
    for (const file of fs.readdirSync(assetsDir)) {
      fs.copyFileSync(path.join(assetsDir, file), path.join(distAssets, file));
      console.log(`  ASSET ${file.padEnd(37)} copied`);
    }
  }

  console.log(`\n  Total JS  saved: ${(totalJsSaved / 1024).toFixed(1)}KB`);
  console.log(`  Total CSS saved: ${(totalCssSaved / 1024).toFixed(1)}KB`);
  console.log('\nBuild complete → dist/');
}

build();
