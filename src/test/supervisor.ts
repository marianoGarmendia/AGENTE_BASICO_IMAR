import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";
import {
  MemorySaver,
  Annotation,
  MessagesAnnotation,
} from "@langchain/langgraph";

import {internacionWorkflow , model} from "../graph";
import {stateAnnotation} from "./main";

import { config } from "dotenv";

export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  next: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "__end__",
  }),
  currentAgent: Annotation<string>({
    reducer: (_, y) => y,
    default: () => "supervisorAgent",
  }),
});



export const supervisorAgent = async (state: typeof stateAnnotation.State) => {
    console.log("START:");
    
   
    
//   const model = new ChatAnthropic({
//     modelName: "claude-3-5-sonnet-20241022",
//     apiKey: process.env.ANTHROPIC_API_KEY!,
//     temperature: 0.3,
//   });

  const systemPrompt = `
  Sos un agente supervisor de IMAR, tu atención es via whatsapp. Tu tarea es dialogar con el usuario y descubrir si desea gestionar:
  - una internación
  - un tratamiento ambulatorio
  - un turno con consultorios externos

  Hacé preguntas amigables para obtener claridad. Una vez que tengas información suficiente, el sistema tomará la decisión de derivar.
  `;

  const systemMessage = new SystemMessage(systemPrompt);
   //@ts-ignore
  const response = await model.invoke([systemMessage, ...state.messages], {
    configurable: { thread_id: "12994" }})

 

  console.log("Supervisor response:", response);
  

  return { messages: [response] }; // se agregará al historial
};
