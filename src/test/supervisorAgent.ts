import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";

// Opciones de agentes disponibles
export const AGENTS = [
  
  "internacion",
  "ambulatorio",
  "consultorios",
  "__end__",
] as const;

const systemPrompt = `
Sos un supervisor encargado de decidir qué área de atención debe gestionar una consulta recibida por WhatsApp.

Los posibles destinos son:
- internacion: temas relacionados con internaciones (nuevas o activas)
- ambulatorio: tratamientos ambulatorios (actuales, nuevos o consultas informativas)
- consultorios: consultorios externos (turnos, médicos, especialidades)

Analizá el mensaje y decidí a qué área debe redirigirse. Si el usuario no menciona ningún motivo claro, respondé con END para finalizar el flujo.
`;

const routingTool = new DynamicStructuredTool({
  name: "route",
  description: "Selecciona el próximo agente a ejecutar.",
  schema: z.object({
    next: z.enum(AGENTS),
  }),
  func: async ({ next }) => ({ next }),
});

// Prompt con placeholders para el historial y opciones
const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("messages"),
  ["human", "¿Quién debe responder a esta consulta? Elegí entre: {options}"],
]);

const prompt = await promptTemplate.partial({
  options: AGENTS.join(", "),
});

export const llm = new ChatAnthropic({
  modelName: "claude-3-5-sonnet-20241022",
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  temperature: 0,
}).bindTools([routingTool], {
  tool_choice: "route",
});

// Supervisor chain (encadenamiento de prompt → modelo → respuesta parseada)
export const supervisorChain = prompt
  .pipe(llm)
  .pipe((output: any) => output.tool_calls?.[0]?.args);

// Función invocable desde LangGraph
export async function supervisorNode(state: { messages: BaseMessage[] }) {
  const result = await supervisorChain.invoke({
    messages: state.messages,
  });

  return { next: result?.next ?? "END" }; // fallback por seguridad
}
