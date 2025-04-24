import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessageLike,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { llm } from "./llm/llm";

import { TavilySearch } from "@langchain/tavily";

import { START, StateGraph, interrupt, Command } from "@langchain/langgraph";
import {
  MemorySaver,
  Annotation,
  MessagesAnnotation,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { InfoPaciente } from "./types/types_pacients";
import {getInfoEspcialistSchedule} from "./tools/info_espcialist_schedule";
import dotenv from "dotenv";
dotenv.config();
import { sendMessage } from "./utils/sendMessageIG";

// process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";
// import * as dotenv from "dotenv";
// dotenv.config();
const tavilySearch = new TavilySearch({
  tavilyApiKey: process.env.TAVILY_API_KEY,
  includeDomains:["http://www.institutoimar.com.ar/","http://www.institutoimar.com.ar/especialidades/listado-especialidades","http://www.institutoimar.com.ar/ambulatorio/sesiones","http://www.institutoimar.com.ar/internacion/hospital-internacion","http://www.institutoimar.com.ar/institucional/bienvenidos"],
  maxResults: 5,
  searchDepth: "advanced"
}) ;



const tools = [getInfoEspcialistSchedule, tavilySearch];

const stateAnnotation = MessagesAnnotation;



const subgraphAnnotation = Annotation.Root({
  ...stateAnnotation.spec,
  info_paciente: Annotation<InfoPaciente>,
});

const model = llm.bindTools(tools);

const toolNode = new ToolNode(tools);

async function callModel(state: typeof subgraphAnnotation.State) {
  const { messages } = state;

  // BassemessageField parameters, which are passed to the model
  const systemsMessage = new SystemMessage(
    `
      Eres un asistente de IA respresentante de IMAR (Instituto de Medicina Avanzada y Rehabilitación).

      contexto: Tu tarea es brindar toda la informacion posible a los pacientes sobre:
      - Médicos y especialidades
      - Horarios de atención
      - Información disponible en la web


      ### Ejemplo de conversación:
      - Paciente: Hola, quiero consultar por un médico de la especialidad de Traumatología
      
      ### Herramientas disponibles:
      - getInfoEspcialistSchedule: Esta herramienta se utiliza cuando un usuario consulta por los días que atiende un médico en particular o quiere saber que médicos hay por especialidad y sus días de atención.
      - tavily_search: Esta herramienta se utiliza cuando un usuario consulta por información y no la encontras disponible en tu contexto entonces vas a obtener información de la web. con la herramienta tavily

      Tu tarea es ayudar a los pacientes a encontrar información sobre médicos, especialidades y horarios de atención.

    `
  );

  const response = await model.invoke([systemsMessage, ...messages]);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

function checkToolCall(state: typeof subgraphAnnotation.State) {
  const { messages } = state;
  console.log("--- checkToolCall ---");

  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage?.tool_calls?.length) {
    return "tools";
  } else {
    return "__end__";
  }
  // Otherwise, we stop (reply to the user)
}

const graph = new StateGraph(subgraphAnnotation);

graph
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent",checkToolCall)
  .addEdge("tools", "agent")

const checkpointer = new MemorySaver();

// Implementacion agente interfazp personalizada
export const workflow = graph.compile({ checkpointer });


// Implementacion langgraph studio sin checkpointer
// export const workflow = graph.compile();

// MODIFICAR EL TEMA DE HORARIOS
// En el calendar de cal esta configurado el horario de bs.as.
// El agente detecta 3hs mas tarde de lo que es en realidad es.
// Ejemplo: si el agente detecta 16hs, en realidad es 13hs.
// Para solucionar este problema, se debe modificar el horario de la herramienta "create_booking_tool".
// En la herramienta "create_booking_tool" se debe modificar el horario de la variable "start".
// En la variable "start" se debe modificar la hora de la reserva.

// const response = await workflow.invoke(
//   { messages: "Hola, quiero consultar por un candidato de id 478" },
//   { configurable: { thread_id: "137" } }
// );

// console.log(response);
