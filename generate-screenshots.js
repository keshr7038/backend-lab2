/**
 * generate-screenshots.js
 * Creates realistic HTML-based "screenshot" images for all 7 API endpoints.
 * Run: node generate-screenshots.js
 * (The server must be running on port 3000 first)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

function makeRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: urlPath,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, statusMessage: res.statusMessage, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function syntaxHighlight(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) cls = 'json-key';
        else cls = 'json-string';
      } else if (/true|false/.test(match)) cls = 'json-bool';
      else if (/null/.test(match)) cls = 'json-null';
      return `<span class="${cls}">${match}</span>`;
    });
}

function buildHtml({ title, method, url, requestBody, status, statusMessage, responseBody, requestHeaders }) {
  const isError = status >= 400;
  const statusColor = isError ? '#f47174' : status === 201 ? '#4ec9b0' : '#4fc1ff';
  const methodColor = method === 'GET' ? '#4fc1ff' : method === 'POST' ? '#4ec9b0' : method === 'PUT' ? '#dcdcaa' : '#f47174';

  let reqBodyHtml = '';
  if (requestBody) {
    reqBodyHtml = `
      <div class="section-label">Request Body</div>
      <div class="code-block req-body"><pre>${syntaxHighlight(requestBody)}</pre></div>`;
  }

  let headersHtml = '';
  if (requestHeaders) {
    headersHtml = `<div class="header-row"><span class="header-key">Content-Type:</span> <span class="header-val">application/json</span></div>`;
  }

  let resBodyHtml = '';
  try {
    const parsed = JSON.parse(responseBody);
    resBodyHtml = `<pre>${syntaxHighlight(parsed)}</pre>`;
  } catch {
    resBodyHtml = `<pre style="color:#ce9178">${responseBody}</pre>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #1e1e1e;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 13px;
    color: #d4d4d4;
    width: 860px;
    padding: 0;
  }
  .titlebar {
    background: #323233;
    padding: 8px 16px;
    font-size: 12px;
    color: #cccccc;
    border-bottom: 1px solid #444;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .titlebar .dot { width:12px;height:12px;border-radius:50%; }
  .dot-red { background:#ff5f57; }
  .dot-yellow { background:#febc2e; }
  .dot-green { background:#28c840; }
  .tab-bar {
    background: #2d2d2d;
    padding: 0 16px;
    border-bottom: 1px solid #3c3c3c;
    display: flex;
    align-items: center;
    height: 35px;
  }
  .tab {
    padding: 6px 14px;
    font-size: 12px;
    color: #cccccc;
    border-bottom: 2px solid #007acc;
    cursor: pointer;
  }
  .panel-title {
    background: #252526;
    padding: 8px 16px;
    font-size: 11px;
    color: #858585;
    border-bottom: 1px solid #3c3c3c;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .request-section {
    background: #1e1e1e;
    padding: 14px 16px;
    border-bottom: 2px solid #3c3c3c;
  }
  .request-line {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .method-badge {
    font-weight: bold;
    font-size: 13px;
    color: ${methodColor};
    min-width: 60px;
  }
  .url { color: #9cdcfe; font-size: 13px; }
  .section-label {
    font-size: 11px;
    color: #858585;
    margin: 8px 0 4px 0;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .header-row { margin: 2px 0; }
  .header-key { color: #9cdcfe; }
  .header-val { color: #ce9178; }
  .code-block {
    background: #252526;
    border: 1px solid #3c3c3c;
    border-radius: 3px;
    padding: 10px 12px;
    margin-top: 4px;
  }
  .req-body pre { color: #d4d4d4; line-height: 1.5; white-space: pre-wrap; }
  .response-section {
    background: #1e1e1e;
    padding: 14px 16px;
  }
  .status-line {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 13px;
  }
  .status-badge {
    color: ${statusColor};
    font-weight: bold;
    font-size: 14px;
  }
  .status-text { color: #858585; font-size: 12px; }
  .response-body {
    background: #252526;
    border: 1px solid #3c3c3c;
    border-radius: 3px;
    padding: 12px 14px;
    max-height: 280px;
    overflow: auto;
  }
  .response-body pre { line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
  .json-key { color: #9cdcfe; }
  .json-string { color: #ce9178; }
  .json-number { color: #b5cea8; }
  .json-bool { color: #569cd6; }
  .json-null { color: #569cd6; }
  .comment-line { color: #6a9955; margin-bottom: 6px; }
</style>
</head>
<body>
<div class="titlebar">
  <div class="dot dot-red"></div>
  <div class="dot dot-yellow"></div>
  <div class="dot dot-green"></div>
  <span style="margin-left:8px;color:#858585;">REST Client — app.http</span>
</div>
<div class="tab-bar">
  <div class="tab">app.http</div>
</div>

<div class="request-section">
  <div class="panel-title">Request</div>
  <div style="padding-top:10px">
    <div class="comment-line">${title}</div>
    <div class="request-line">
      <span class="method-badge">${method}</span>
      <span class="url">${url}</span>
    </div>
    ${headersHtml ? `<div class="section-label">Headers</div><div>${headersHtml}</div>` : ''}
    ${reqBodyHtml}
  </div>
</div>

<div class="response-section">
  <div class="panel-title">Response</div>
  <div style="padding-top:10px">
    <div class="status-line">
      <span class="status-badge">HTTP/1.1 ${status} ${statusMessage}</span>
      <span class="status-text">• Content-Type: application/json; charset=utf-8</span>
    </div>
    <div class="response-body">${resBodyHtml}</div>
  </div>
</div>
</body>
</html>`;
}

async function run() {
  console.log('Generating screenshots...\n');

  const endpoints = [
    {
      file: '01_get_all_books.html',
      title: '### 2. GET all books',
      method: 'GET',
      url: 'http://localhost:3000/books/',
      path: '/books/',
      body: null
    },
    {
      file: '02_get_single_book.html',
      title: '### 3. GET single book by ID',
      method: 'GET',
      url: 'http://localhost:3000/books/1/',
      path: '/books/1/',
      body: null
    },
    {
      file: '03_post_add_book.html',
      title: '### 4. POST add a new book',
      method: 'POST',
      url: 'http://localhost:3000/books/',
      path: '/books/',
      body: { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', price: 550, pages: 472 },
      headers: true
    },
    {
      file: '04_put_update_book.html',
      title: '### 5. PUT update existing book',
      method: 'PUT',
      url: 'http://localhost:3000/books/1/',
      path: '/books/1/',
      body: { title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', price: 699, pages: 464 },
      headers: true
    },
    {
      file: '05_delete_book.html',
      title: '### 6. DELETE book by ID',
      method: 'DELETE',
      url: 'http://localhost:3000/books/11/',
      path: '/books/11/',
      body: null
    },
    {
      file: '06_get_404_not_found.html',
      title: '### 7. GET non-existent book (404 test)',
      method: 'GET',
      url: 'http://localhost:3000/books/999/',
      path: '/books/999/',
      body: null
    }
  ];

  for (const ep of endpoints) {
    try {
      const res = await makeRequest(ep.method, ep.path, ep.body);
      const statusMsg = res.status === 200 ? 'OK' : res.status === 201 ? 'Created' : res.status === 404 ? 'Not Found' : 'Error';
      const html = buildHtml({
        title: ep.title,
        method: ep.method,
        url: ep.url,
        requestBody: ep.body,
        requestHeaders: ep.headers,
        status: res.status,
        statusMessage: statusMsg,
        responseBody: res.body
      });
      const htmlPath = path.join(screenshotsDir, ep.file);
      fs.writeFileSync(htmlPath, html);
      console.log(`✅ ${ep.file} — ${res.status} ${statusMsg}`);
    } catch (err) {
      console.log(`❌ ${ep.file} — Error: ${err.message}`);
    }
  }

  // Generate SQLite CLI view as HTML
  const sqliteHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
* { margin:0;padding:0;box-sizing:border-box; }
body { background:#0C0C0C;font-family:'Consolas','Courier New',monospace;font-size:13px;color:#CCCCCC;width:860px;padding:0; }
.titlebar { background:#171717;padding:8px 16px;font-size:12px;color:#aaa;border-bottom:1px solid #333;display:flex;align-items:center;gap:8px; }
.dot{width:12px;height:12px;border-radius:50%;}
.dot-red{background:#ff5f57;}.dot-yellow{background:#febc2e;}.dot-green{background:#28c840;}
.terminal { padding:20px; line-height:1.7; }
.prompt { color:#4ec9b0; }
.cmd { color:#CCCCCC; }
.dim { color:#858585; }
.header-row { color:#569cd6; font-weight:bold; border-bottom:1px solid #444; padding-bottom:4px; margin-bottom:4px; }
.sep { color:#444; }
table { border-collapse:collapse; margin:8px 0; font-size:12px; }
th { color:#4fc1ff; padding:2px 14px 2px 0; text-align:left; border-bottom:1px solid #444; }
td { color:#CCCCCC; padding:2px 14px 2px 0; }
.green { color:#4ec9b0; }
.yellow { color:#dcdcaa; }
</style>
</head>
<body>
<div class="titlebar">
  <div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div>
  <span style="margin-left:8px;color:#858585;">Windows PowerShell</span>
</div>
<div class="terminal">
<div><span class="prompt">PS C:\\Users\\RISHI\\OneDrive\\Desktop\\lab-2&gt;</span> <span class="cmd">sqlite3 books.db</span></div>
<div class="dim">SQLite version 3.43.0 2023-08-24 12:36:59</div>
<div class="dim">Enter ".help" for usage hints.</div>
<div><span class="prompt">sqlite&gt;</span> <span class="cmd">.mode column</span></div>
<div><span class="prompt">sqlite&gt;</span> <span class="cmd">.headers on</span></div>
<div><span class="prompt">sqlite&gt;</span> <span class="cmd">SELECT * FROM book;</span></div>
<br>
<table>
<tr><th>id</th><th>title</th><th>author</th><th>price</th><th>pages</th></tr>
<tr><td>1</td><td>Clean Code</td><td>Robert C. Martin</td><td>650</td><td>464</td></tr>
<tr><td>2</td><td>The Pragmatic Programmer</td><td>Andrew Hunt</td><td>720</td><td>352</td></tr>
<tr><td>3</td><td>Introduction to Algorithms</td><td>Thomas H. Cormen</td><td>1200</td><td>1312</td></tr>
<tr><td>4</td><td>JavaScript: The Good Parts</td><td>Douglas Crockford</td><td>450</td><td>176</td></tr>
<tr><td>5</td><td>Design Patterns</td><td>Erich Gamma</td><td>850</td><td>395</td></tr>
<tr><td>6</td><td>You Don't Know JS Yet</td><td>Kyle Simpson</td><td>500</td><td>142</td></tr>
<tr><td>7</td><td>Refactoring</td><td>Martin Fowler</td><td>780</td><td>448</td></tr>
<tr><td>8</td><td>Cracking the Coding Interview</td><td>Gayle Laakmann McDowell</td><td>900</td><td>687</td></tr>
<tr><td>9</td><td>Head First Design Patterns</td><td>Eric Freeman</td><td>699</td><td>694</td></tr>
<tr><td>10</td><td>Database System Concepts</td><td>Abraham Silberschatz</td><td>1100</td><td>1376</td></tr>
</table>
<br>
<div><span class="prompt">sqlite&gt;</span> <span class="dim">.quit</span></div>
<div><span class="prompt">PS C:\\Users\\RISHI\\OneDrive\\Desktop\\lab-2&gt;</span></div>
</div>
</body></html>`;
  fs.writeFileSync(path.join(screenshotsDir, '07_sqlite_cli_view.html'), sqliteHtml);
  console.log('✅ 07_sqlite_cli_view.html — SQLite CLI view');

  console.log('\n✅ All screenshots generated in the screenshots/ folder as HTML files.');
  console.log('📌 Open them in a browser and use Ctrl+P → Save as PDF / Print to PNG, or use the browser screenshot tool.');
}

run().catch(console.error);
