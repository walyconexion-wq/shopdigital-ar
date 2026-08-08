const http = require('http');

const PORT = process.env.PORT || 3001;

const NOTEBOOK_KNOWLEDGE_PROMPTS = {
  "cb9442de-e444-4ca0-98a4-914ca6e3980a": "MELISA (Marketing & Crecimiento): Pautas, embudos, promociones y captacion.",
  "0a83b1d9-e35e-4473-8033-648f89f81339": "GEMY (Estratega General): Expansion fractal, sincronia inter-bunker.",
  "84679a73-8766-4f2a-a97d-5fe0b70e7730": "BRUNO (Inteligencia Territorial): Demografia, mapas y zonas comerciales.",
  "7fa97dfa-6643-4dc9-8690-6c02e8338280": "ELY (Administracion y Finanzas): Control impositivo, semaforo financiero.",
  "88340a8c-838a-4835-99d9-6b77e911307b": "MATEO (Planificacion Estrategica): ROI, tiempos y cuellos de botella.",
  "e0e4f151-7847-4631-8769-282ead74c670": "THOR (SecOps & Ciberseguridad): Protocolo Doberman, reglas Firestore, cortafuegos.",
  "ef87d269-4daf-4a2c-a658-5992c9150042": "LUZ (Desarrollo de Sistemas): Arquitectura full-stack, APIs, despliegues.",
  "71668861-44e3-40fe-8cde-74cf99b11623": "MAX (Inversiones & Activos): Tasa 26% interna, 5% YPF, rendimiento cripto.",
  "509fde7f-4b31-4beb-abab-420a30a0973e": "LORE (Contable y Legal): Auditoria legal, contratos y tasas.",
  "9a90488c-7519-441c-b845-d7b1c3bd5321": "JAVI (Mantenimiento e Inventario): Logistica de insumos y reparaciones.",
  "82a1b7bf-3899-49f5-8b4c-3d082fcad671": "CUBY (Transmisiones y Logistica): Pautas en vivo, alertas Ntfy, antenas.",
  "d302846c-db1d-4c88-9f1d-b6e07a456d29": "LETY (Recursos y Talento): Induccion de embajadores, seleccion y academia."
};

const server = http.createServer((req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/api/mcp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { tool, arguments: args } = payload;
        
        if (tool === 'query_notebook' && args && args.notebook_id) {
          const agentInfo = NOTEBOOK_KNOWLEDGE_PROMPTS[args.notebook_id] || "Bunker Especialista";
          const mockResponse = {
            content: [
              {
                type: "text",
                text: `[RESPUESTA MCP CANAL NOTEBOOKLM] Conectado exitosamente al cuaderno ID (${args.notebook_id}). Especialista: ${agentInfo}. Consulta procesada: "${args.query}". La cañería MCP está ACTIVA.`
              }
            ]
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(mockResponse));
        }

        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: "Llamada MCP invalida" }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: "ok", service: "notebooklm-mcp-server" }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: "Ruta no encontrada" }));
  }
});

server.listen(PORT, () => {
  console.log(`[MCP SERVER] Servidor escuchando en http://localhost:${PORT}/api/mcp`);
});
