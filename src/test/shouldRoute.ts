import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import {stateAnnotation} from "./main"; // Importa el estado del grafo principal
import {Command} from "@langchain/langgraph";
import { AGENTS } from "./supervisorAgent";


const routingTool = new DynamicStructuredTool({
  name: "route",
  description: "Selecciona el próximo agente.",
  schema: z.object({
    next: z.enum(AGENTS),
  }),
  func: async ({ next }) => ({ next }),
});

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", `
  Dada la siguiente conversación, decidí si hay información suficiente para asignar al área correspondiente:
  {options}
  Si aún no está claro, respondé con "__end__".
  `],
  new MessagesPlaceholder("messages"),
  ["human", "¿Quién debe atender esta consulta?"],
]);

const prompt = await promptTemplate.partial({
  options: AGENTS.join(", "),
});

const model = new ChatAnthropic({
  modelName: "claude-3-5-sonnet-20241022",
  apiKey: process.env.ANTHROPIC_API_KEY!,
  temperature: 0,
}).bindTools([routingTool], { tool_choice: "route" });

const deciderChain = prompt.pipe(model).pipe((output: any) => {

    console.log("Decider output:", output);
    console.log("Tool calls:", output.tool_calls);

   return  output.tool_calls?.[0]?.args});



export const routeDecision = async (state: typeof stateAnnotation.State) => {
  const result = await deciderChain.invoke({
    messages: state.messages,
  });
   

  const nextAgent = result?.next ?? "__end__"

  console.log("Next agent decided:", nextAgent);
  

  return {
    next: nextAgent,
    currentAgent: nextAgent,
  }

}