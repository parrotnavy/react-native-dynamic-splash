const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
  console.log(`[MockServer] Request: ${req.url}`);

  let filename = req.url.substring(1); // remove leading slash
  if (filename === '') filename = 'index.html';
  
  const filePath = path.join(__dirname, '../../docs', filename);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`[MockServer] Running at http://localhost:${PORT}/`);
  console.log(`[MockServer] Serving content from ./mock-api`);
});
