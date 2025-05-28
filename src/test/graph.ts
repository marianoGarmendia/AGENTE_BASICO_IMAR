import { END, Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import dotenv from "dotenv";
dotenv.config();

// This defines the object that is passed between each node
// in the graph. We will create different nodes for each agent and tool
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  // The agent node that last performed work
  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END,
  }),
});

import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { DynamicStructuredTool } from "@langchain/core/tools";
import * as d3 from "d3";
// ----------ATTENTION----------
// If attempting to run this notebook locally, you must follow these instructions
// to install the necessary system dependencies for the `canvas` package.
// https://www.npmjs.com/package/canvas#compiling
// -----------------------------
import { createCanvas } from "canvas";
import { z } from "zod";
import * as tslab from "tslab";

const specialistMedic = new DynamicStructuredTool({
    name: "coronograma_de_medicos",
    description:"Da informacion sobre los medicos especialistas y sus horarios de atencion",
    schema: z.object({
        location: z.string().describe("Ubicación para obtener el clima actual"),
    }),
func: async ({ location }) => {
    return `El clima actual en ${location} es soleado con una temperatura de 25°C.`;
}})

const tavilyTool = new TavilySearchResults({
    apiKey: process.env.TAVILY_API_KEY ?? "",
});

// CREAMOS EL SUPERVISOR

// import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";

import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

const members = ["info_clima", "chart_generator"] as const;

const systemPrompt =
  "You are a supervisor tasked with managing a conversation between the" +
  " following workers: {members}. Given the following user request," +
  " respond with the worker to act next. Each worker will perform a" +
  " task and respond with their results and status. When finished," +
  " respond with FINISH.";
const options = [END, ...members];

// Define the routing function
const routingTool = {
  name: "route",
  description: "Select the next role.",
  schema: z.object({
    next: z.enum([END, ...members]),
  }),
}

const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("messages"),
  [
    "human",
    "Given the conversation above, who should act next?" +
    " Or should we FINISH? Select one of: {options}",
  ],
]);

const formattedPrompt = await prompt.partial({
  options: options.join(", "),
  members: members.join(", "),
});

const llm = new ChatAnthropic({
  modelName: "claude-3-5-sonnet-20241022",
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  temperature: 0,
});

const supervisorChain = formattedPrompt
  .pipe(llm.bindTools(
    [routingTool],
    {
      tool_choice: "route",
    },
  ))
  // select the first one
  .pipe((x) => (x.tool_calls &&  x.tool_calls[0].args));

import { HumanMessage } from "@langchain/core/messages";

const response = await supervisorChain.invoke({
  messages: [
    new HumanMessage({
      content: "write a report on birds.",
    }),
  ],
});

console.log("Supervisor response:", response);

