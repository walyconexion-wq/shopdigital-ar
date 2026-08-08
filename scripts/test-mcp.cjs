const http = require('http');

const data = JSON.stringify({
  server: "notebooklm-mcp-server",
  tool: "query_notebook",
  arguments: {
    notebook_id: "ef87d269-4daf-4a2c-a658-5992c9150042",
    query: "Reporte de estado de arquitectura para Luz"
  }
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/mcp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('HTTP STATUS:', res.statusCode);
    console.log('RESPONSE:', body);
  });
});

req.on('error', (err) => {
  console.error('ERROR:', err.message);
});

req.write(data);
req.end();
