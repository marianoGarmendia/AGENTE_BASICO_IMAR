import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { START, StateGraph, interrupt, Command } from "@langchain/langgraph";
import {
  MemorySaver,
  Annotation,
  MessagesAnnotation,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

// process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";
// import * as dotenv from "dotenv";
// dotenv.config();
const tavilySearch = new TavilySearchResults({
  apiKey: process.env.TAVILY_API_KEY,
});

// const sendMail = tool(
//   async ({ to, subject, message }) => {
//     try {
//       const response = await fetch(
//         "https://samrtdevs.app.n8n.cloud/webhook/2ff1c782-39a9-49e9-9316-4da4883a265e",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             to,
//             subject,
//             message,
//           }),
//         }
//       );

//       const res =
//         response.status === 200 ? "Mail enviado" : "Error al enviar mail";
//       return res;
//     } catch (error: any) {
//       throw new Error("Error al enviar mail" + error.message);
//     }
//   },
//   {
//     name: "sendMail",
//     description:
//       "envía mail con informacion detallada al usuario que hizo las consultas",
//     schema: z.object({
//       to: z
//         .string()
//         .describe("correo electronico del usuario al que será enviado el mail"),
//       subject: z.string().describe("asunto del mail"),
//       message: z.string().describe("mensaje del mail"),
//     }),
//   }
// );

const tools = [tavilySearch];

const stateAnnotation = MessagesAnnotation;

const subgraphAnnotation = Annotation.Root({
  ...stateAnnotation.spec,
  humanFeedback: Annotation<string>,
});

export const model = new ChatOpenAI({
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
}).bindTools(tools);

const toolNode = new ToolNode(tools);

async function callModel(state: typeof subgraphAnnotation.State) {
  const { messages } = state;

  const systemsMessage = new SystemMessage(
    `
      
    


    `
  );

  const response = await model.invoke(systemsMessage, ...messages);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

function checkToolCall(state: typeof subgraphAnnotation.State) {
  const { messages, humanFeedback } = state;
  console.log("--- checkToolCall ---");
  console.log("humanFeedback: ", humanFeedback);

  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage?.tool_calls?.length) {
    return "tools";
  } else {
    return "__end__";
  }
  // Otherwise, we stop (reply to the user)
}

const humanFeedback = (_state: typeof subgraphAnnotation.State) => {
  console.log("--- humanFeedback ---");
  const feedback: string = interrupt("Please provide feedback");
  return {
    userFeedback: feedback,
  };
};

const graph = new StateGraph(subgraphAnnotation);

graph
  .addNode("agent", callModel)
  .addNode("human_feedback", humanFeedback)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addEdge("agent", "human_feedback")
  .addConditionalEdges("human_feedback", checkToolCall, ["tools", "__end__"])
  .addEdge("tools", "agent");

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
