import { StateGraph , MessagesAnnotation, Annotation} from "@langchain/langgraph";

import { llm } from "./llm/llm";

const stateAnnotation = MessagesAnnotation;
const subgraphAnnotation = Annotation.Root({
  ...stateAnnotation.spec,
  campos_faltantes: Annotation<Object>,
  tiene_convenio: Annotation<Boolean>,
});


const callmodel = (state: typeof subgraphAnnotation.State) => {
  const { messages } = state;
//   return llm.invoke(messages);
}