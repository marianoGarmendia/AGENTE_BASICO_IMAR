// main.ts

import { StateGraph, START } from "@langchain/langgraph";
import { MemorySaver, Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { supervisorNode, AGENTS } from "./supervisorAgent";
import {supervisorAgent} from "./supervisor"; // Tu agente supervisor
import { shouldRoute } from "./shouldRoute"; // Función para decidir el agente
import { internacionWorkflow } from "../graph"; // Tu agente actual
// import { ambulatorioWorkflow } from "./ambulatorio";
// import { consultoriosWorkflow } from "./consultorios";

/////////////////////////
// 1. Definir el estado
/////////////////////////

const stateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  next: Annotation<typeof AGENTS[number]>({
    reducer: (x, y) => y ?? x ?? "__end__",
    default: () => "__end__",
  })
    
});

/////////////////////////
// 2. Crear el grafo maestro
/////////////////////////

const graph = new StateGraph(stateAnnotation);

graph
  .addNode("supervisor", supervisorAgent)
  .addNode("internacion", internacionWorkflow)
  .addNode("ambulatorio", async () => {
      return { messages: [new HumanMessage("⚠️ Agente ambulatorio aún no implementado")] };
    })
  .addNode("consultorios", async () => {
    return { messages: [new HumanMessage("⚠️ Agente consultorios aún no implementado")] };
  })
  .addEdge(START, "supervisor")
  .addConditionalEdges("supervisor", shouldRoute, [
    "internacion",
   "ambulatorio",
    "consultorios",
    "__end__",
  ])

  // Redirección según el agente que elija el supervisor
//   .addConditionalEdges("supervisor", (state) => state.next, {
//     internacion: "internacion",
//     ambulatorio: "ambulatorio",
//     consultorios: "consultorios",
//     END: "__end__",
//   })
  
  // Subgrafos de agentes

const checkpointer = new MemorySaver();
export const compiledGraph = graph.compile();

/////////////////////////
// 3. Simular mensaje desde WhatsApp
/////////////////////////

async function handleIncomingMessage(text: string, thread_id: string) {
  const input = {
    messages: [new HumanMessage(text)],
  };

  const result = await compiledGraph.invoke(input, {
    configurable: {
      thread_id, // persistencia de conversación por usuario
    },
  });

  console.log("Resultado del flujo:", result);
}

/////////////////////////
// 4. Ejecutar ejemplo
/////////////////////////

// handleIncomingMessage("Hola, mi mamá necesita una internación urgente", "user-whatsapp-123");
