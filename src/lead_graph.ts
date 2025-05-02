import { StateGraph , MessagesAnnotation, Annotation} from "@langchain/langgraph";


import { llm } from "./llm/llm";

interface InfoPaciente {
  [key: string]: any;
}

const stateAnnotation = MessagesAnnotation;
const subgraphAnnotation = Annotation.Root({
  ...stateAnnotation.spec,
  campos_faltantes: Annotation<Object>,
  tiene_convenio: Annotation<Boolean>,
  campos_completados: Annotation<Object>,
  info_paciente: Annotation<InfoPaciente>,
});


const callmodel = (state: typeof subgraphAnnotation.State) => {
  const { messages } = state;
//   return llm.invoke(messages);
}