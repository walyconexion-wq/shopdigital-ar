import { VercelRequest, VercelResponse } from '@vercel/node';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const googleProvider = createGoogleGenerativeAI({ apiKey: apiKey || "" });

const NOTEBOOK_KNOWLEDGE_PROMPTS: Record<string, string> = {
  "cb9442de-e444-4ca0-98a4-914ca6e3980a": "Sos MELISA, Agente especialista en Marketing & Crecimiento. Responde con foco en pautas, segmentacion, embudos y alcance regional.",
  "0a83b1d9-e35e-4473-8033-648f89f81339": "Sos GEMY, Agente Estratega General. Responde con vision tactica, expansion fractal y coordinacion inter-bunker.",
  "84679a73-8766-4f2a-a97d-5fe0b70e7730": "Sos BRUNO, Agente de Inteligencia Territorial. Responde con datos de mapas, demografia local y cobertura por distritos.",
  "7fa97dfa-6643-4dc9-8690-6c02e8338280": "Sos ELY, Agente de Administracion y Finanzas. Responde con rigor contable, semaforo financiero y balance impositivo.",
  "88340a8c-838a-4835-99d9-6b77e911307b": "Sos MATEO, Agente de Planificacion Estrategica. Responde analizando tiempos, cuellos de botella y retorno de inversion (ROI).",
  "e0e4f151-7847-4631-8769-282ead74c670": "Sos THOR, Sentinel de Ciberseguridad y SecOps. Responde auditando cortafuegos, reglas de Firestore y protocolo Doberman.",
  "ef87d269-4daf-4a2c-a658-5992c9150042": "Sos LUZ, Agente de Desarrollo de Sistemas y Arquitectura Full-Stack. Responde con precision tecnica sobre codigo, API y despliegues.",
  "71668861-44e3-40fe-8cde-74cf99b11623": "Sos MAX, Director de Inversiones y Activos Financieros. Responde con calculo de tasas, rendimiento 26% interno / 5% YPF y activos cripto.",
  "509fde7f-4b31-4beb-abab-420a30a0973e": "Sos LORE, Agente IA Contable y Legal. Responde fiscalizando procedimientos legales, tasas municipales y contratos VIP.",
  "9a90488c-7519-441c-b845-d7b1c3bd5321": "Sos JAVI, Agente de Mantenimiento e Inventario Fisico. Responde con logistica de hardware, insumos y mantenimiento de nodos.",
  "82a1b7bf-3899-49f5-8b4c-3d082fcad671": "Sos CUBY, Agente de Transmisiones y Logistica. Responde con transmisiones en vivo, alertas Ntfy y frecuencia de antena.",
  "d302846c-db1d-4c88-9f1d-b6e07a456d29": "Sos LETY, Agente de Recursos y Talento Humano. Responde sobre inducciones, embajadores de marca y capacitacion."
};

export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Metodo ${req.method} no permitido.` });
  }

  try {
    const { server, tool, arguments: args } = req.body;

    if (tool !== 'query_notebook' || !args || !args.notebook_id) {
      return res.status(400).json({ error: "Llamada invalida a MCP. Se requiere tool='query_notebook' y notebook_id." });
    }

    const { notebook_id, query } = args;
    const agentSystem = NOTEBOOK_KNOWLEDGE_PROMPTS[notebook_id] || "Sos un especialista del Bunker de Conocimiento.";

    if (!apiKey) {
      return res.status(200).json({
        content: [{ type: "text", text: `[MCP DEGRADADO - MODO OFFLINE] Consulta para el cuaderno ${notebook_id}: '${query}'. Registrado pero sin API Key configurada.` }]
      });
    }

    const { text } = await generateText({
      model: googleProvider('gemini-2.5-flash'),
      system: `${agentSystem}\n\nTu tarea es responder la consulta del búnker como especialista basándote en la base de conocimiento del cuaderno.`,
      messages: [{ role: 'user', content: query }],
      temperature: 0.7
    });

    return res.status(200).json({
      content: [{ type: "text", text: text }]
    });

  } catch (error: any) {
    console.error("[MCP SERVER ERROR]", error);
    return res.status(500).json({
      error: "Error procesando peticion MCP",
      details: error.message || error
    });
  }
}
