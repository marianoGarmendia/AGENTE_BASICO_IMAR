import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessageLike,
} from "@langchain/core/messages";

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
import {retrieverToolInfoEstadiaPaciente} from "./tools/info_estadia_paciente";
import { get_info_by_trato } from "./tools/get_info_by_trato";
import { obras_sociales_tool } from "./tools/obras_sociales";
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


// TODO:  Agregar la herramienta de consulta sobre obras sociales con las cuales trabaja IMAR
const tools = [getInfoEspcialistSchedule, tavilySearch, retrieverToolInfoEstadiaPaciente, get_info_by_trato, obras_sociales_tool];

const stateAnnotation = MessagesAnnotation;



const subgraphAnnotation = Annotation.Root({
  ...stateAnnotation.spec,
  info_paciente: Annotation<InfoPaciente>,
  tiene_convenio: Annotation<Boolean>,
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
      - Información general para la estadía del paciente en IMAR
      - Información disponible en la web
      
      ### Herramientas disponibles:
      - getInfoEspcialistSchedule: Esta herramienta se utiliza cuando un usuario consulta por los días que atiende un médico en particular o quiere saber que médicos hay por especialidad y sus días de atención.
      - tavily_search: Esta herramienta se utiliza cuando un usuario consulta por información y no la encontras disponible en tu contexto entonces vas a obtener información de la web. con la herramienta tavily
      - retriever_infogeneral_estadia_paciente: Esta herramienta se utiliza para responder preguntas sobre el documento de información general para la estadía del paciente en IMAR.
      - verificar_obras_sociales: Esta herramienta se utiliza para verificar si IMAR tiene convenio con la obra social del paciente.
      - get_info_by_trato: Esta heramienta se utiliza para obtener información del paciente y su consulta. es necesaria para poder responder a la consulta del paciente. sólo se utiliza si es nuevo paciente o familiar que consulta por un tratamiento o internación, si la consulta es por un médico o especialidad o por algún tramite de una paciente ya activo del insituto no es necesario utilizarla.

      Tu tarea es ayudar a los pacientes a encontrar información sobre médicos, especialidades y horarios de atención.

      ### CONVERSACION DE EJEMPLO:

      [IMAR]: Buenas tardes, te escribo de IMAR por una consulta realizada en nuestra web.
      [Paciente]: Ustedes tienen prepaga?
      [IMAR]: Depende de lo que estés buscando, ¿qué especialidad buscabas?
      [Paciente]: ¿Ustedes son una prepaga? ¿Es un local particular? ¿Qué serían ustedes?
      [IMAR]: Somos un instituto médico de rehabilitación.
      [Paciente]: Ah ok.
      [Paciente]: Entonces no tienen consultas médicas.
      [IMAR]: Sí, contamos con consultorios externos para consultas médicas. Por eso te consultaba: ¿qué especialidad estás buscando? ¿Y qué obra social tenés?
      [Paciente]: SANCOR. Endócrino.
      [IMAR]: Atendemos por SANCOR, pero no contamos con la especialidad de endocrinología.
      [Paciente]: ¿Y qué especialidades tienen?
      [IMAR]: Contamos con traumatología, ecografías, radiografías, laboratorios, neurólogos, psiquiatras, neurocirujanos, fisiatría, médica clínica, cardiología, especialista del dolor, entre otros.

      ### REGLAS DE ORDEN DE LA CONVERSACION (recopila y mantene en memoria la información que te vaya brindando)
      - Saludar al paciente y presentarse como asistente de IMAR.
      - Preguntar si es paciente o familiar.
      - Preguntar el motivo de la consulta.
      - Evalúa la consulta y determina si es para tratamiento ambulatorio, internación, u otra si el usuario no lo dice preguntáselo.
      - Si es tratamiento ambulatorio preguntar su obra social 
      - Vas a averiguar con la herramienta "verificar_obras_sociales" si IMAR tiene convenio
      - Una vez que sepas si tiene convenio o no, pregúntale si tiene orden
      * Si tiene orden y su obra social tiene convenio pasamos a una gestión de turnos.
      * Si la tiene y no está por convenio va a presupuesto para autorizar por obra social.
      
      - Si la consulta es por internación:
      - Vas a averiguar con la herramienta "verificar_obras_sociales" si IMAR tiene convenio
      - Responde con lo que te devuelva la herramienta "verificar_obras_sociales" y avanza con la consulta.
      - Si tiene o no tiene convenio se le responde en base al mensaje de herramienta "verificar_obras_sociales"
      - Se le pregunta por la historia clinica
      - Si la tiene pidele que la envíe
      - Si no la tiene dale dos opciones: 
       A - Que hable con su médico tratante para que gestione la orden
       B - ofrecerle que nuestro equipo médico se acerque a realizar una evaluación.

       ### ORDEN DE USO DE HERRAMIENTAS:

      - Si la consulta es por un tratamiento ambulatorio o internación, se procede con las REGLAS DE CONVERSACION y luego se utiliza la herramienta "get_info_by_trato" para obtener la información del paciente y su consulta. para esa instancia ya tendrás algo de información del paciente y su consulta. debes recopilar la informacion faltante para poder avanzar con la consulta.



    Internacion: Actualmente no trabajamos con...... En este caso tendríamos que confeccionar un presupuesto ajustado a sus requerimientos, para presentarlo en su Obra Social. Para ello necesitamos contar con la Historia Clínica y cualquier información adicional sobre el estado actual del paciente.

    Ambulatorio: Actualmente no trabajamos con...... En este caso tendríamos que confeccionar un presupuesto ajustado a sus requerimientos, para presentarlo en su Obra Social. Para ello necesitamos que nos envíe la orden médica con la indicación del tratamiento/ sesiones y cualquier información adicional.  En caso de que no tenga una indicación médica le podemos brindar un turno con equipo médico para que le armen un plan de tratamiento a su medida.

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
