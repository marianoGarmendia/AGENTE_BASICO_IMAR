import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessageLike,
} from "@langchain/core/messages";
import { z } from "zod";
import { llm } from "./llm/llm";
import {ChatOpenAI} from "@langchain/openai";
import { TavilySearch } from "@langchain/tavily";
import { formatMessages } from "./utils/format-messages";
import { START, StateGraph, interrupt, Command, LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  MemorySaver,
  Annotation,
  MessagesAnnotation,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { InfoPaciente } from "./types/types_pacients";
import { getInfoEspcialistSchedule } from "./tools/info_espcialist_schedule";
import { retrieverToolInfoEstadiaPaciente } from "./tools/info_estadia_paciente";
import { get_info_by_trato } from "./tools/get_info_by_trato";
import { obras_sociales_tool } from "./tools/obras_sociales";
import { leadSchema} from "./types/type_lead";
import {load_lead} from "./tools/load_lead";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY_IMAR = process.env.OPENAI_API_KEY_IMAR || "";
// process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";
// import * as dotenv from "dotenv";
// dotenv.config();
const tavilySearch = new TavilySearch({
  tavilyApiKey: process.env.TAVILY_API_KEY,
  includeDomains: [
    "http://www.institutoimar.com.ar/",
    "http://www.institutoimar.com.ar/especialidades/listado-especialidades",
    "http://www.institutoimar.com.ar/ambulatorio/sesiones",
    "http://www.institutoimar.com.ar/internacion/hospital-internacion",
    "http://www.institutoimar.com.ar/institucional/bienvenidos",
  ],
  maxResults: 5,
  searchDepth: "advanced",
});

// TODO:  Agregar la herramienta de consulta sobre obras sociales con las cuales trabaja IMAR
const tools = [
  getInfoEspcialistSchedule,
  tavilySearch,
  retrieverToolInfoEstadiaPaciente,
  get_info_by_trato,
  obras_sociales_tool,
];




const stateAnnotation = MessagesAnnotation;

const subgraphAnnotation = Annotation.Root({
  ...stateAnnotation.spec,
  info_paciente: Annotation<InfoPaciente>,
  tiene_convenio: Annotation<Boolean>,
  is_new_patient: Annotation<Boolean>,
  is_familiar: Annotation<Boolean>,
  is_ambulatorio: Annotation<Boolean>,
  is_internacion: Annotation<Boolean>,
});

// Manera de inicializar el estado de la conversación
// is_new_patient: Annotation<Boolean>({reducer: (a, b) => b ,default: () => true}),
let isNew = true
let isConsultrioExterno = false



const model = llm.bindTools(tools);

const toolNode = new ToolNode(tools);

async function callModel(state: typeof subgraphAnnotation.State) {
  const { messages  } = state;

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
      - Se le pregunta si es ára el ingreso de un paciente o para un paciente internado.
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

    ### TEMAS IMPORTANTES A TENER EN CUENTA:
    - Atención por profesionales medicos con turno: en este caso cada médico tiene su propia gestión de cobro y trabaja con obras sociales diferentes, por esto mismo hay que consultar en recepcion sobre las obras sociales que trabajo cada médico y si cobra un diferencial o no.

    
   

    `
  );

  const response = await model.invoke([systemsMessage, ...messages]);

  // We return a list, because this will get added to the existing list
  console.log("NODO AGENTE: ");
  
  return { messages: [response] };
}

const routeStart = (state: typeof subgraphAnnotation.State): "extraction" |  "agent"=> {
  const {is_new_patient} = state;
  
  console.log("is new paciente: ", isNew);
  
  if(isNew){
    console.log("Deriva a extraction desde routestart");
    
    return "extraction"
  }else{
    console.log("Deriva a agent desde routestart");

    return "agent"
  }
}

const extractInfo = async (state: typeof subgraphAnnotation.State, config : LangGraphRunnableConfig) => {
  const {messages} = state;
  const cel_number = config.configurable?.thread_id;
  console.log("ExtractInfo: ");
  
  const schema = z.object({
    Full_Name: z
      .string()
      .describe(
        "Si es un familiar, su nombre completo ya que va a ser el nombre del contacto para el paciente",
      ),
    Email: z
      .string()
      .optional()
      .describe("El mail de la persona que se está contactando"),
      Nombre_y_Apellido_paciente: z
      .string()
      
      .describe("The end date of the trip. Should be in YYYY-MM-DD format"),
      Tipo_de_tratamiento: z
      .enum(["Tto. ambulatorio" , "Internación", "Consultorio externo"])
      .describe(
        "El tipo de tratamiento que se está solicitando, si es ambulatorio o internación, esto aplica si es un ingreso nuevo",
      ),
      Last_Name: z.string().describe("Apellido del paciente, si él que está hablando es un familiar pregunarle por el apellido del paciente"),
     tipo_de_psible_cliente: z
      .enum(["Paciente", "Familiar responsable", "Contacto institucional"]).describe("Es el tipo de cliente que se está contactando"),
      Obra_social: z
      .string().describe("La obra social de la persona que va a recibir el tratamiento o la internación"),
      Description: z
      .string().describe("Descripción de la consulta, un resumen de la consulta, extraer la más importante y el motivo por el cual se contacta"),
  });

  const modelExtraction = new ChatOpenAI({ model: "gpt-4o", temperature: 0 , apiKey:OPENAI_API_KEY_IMAR }).bindTools([
    {
      name: "extraer_info_primer_consulta",
      description: "Una herramienta para extraer información de la conversación que se está iniciando, para identificar el tipo de persoona que se está contactando y el motivo de la consulta.",
      schema: schema,
    },
  ]).withConfig({tags: ["nostream"]});

  const prompt = `Eres un asistente de IA para gestionar consultas de IMAR.
  Debes ir guiando de manera natural al usuario para que te brinde la información necesaria para poder ayudarlo.
  En este caso, el usuario es un paciente o familiar que está contactando a IMAR para solicitar un tratamiento o una internación.
  El objetivo es extraer la información necesaria para poder ayudarlo a gestionar su consulta.
  
  La información que debes extraer es la siguiente: 
          full_name: Nombre completo de la persona que se está contactando (si es un familiar, su nombre completo ya que va a ser el nombre del contacto para el paciente).
          email: El mail de la persona que se está contactando.
          obra_social: La obra social de la persona que va a recibir el tratamiento o la internación.
          tipo_de_tratamiento: El tipo de tratamiento que se está solicitando, si es ambulatorio, internación o consultorio externo, esto aplica si es un ingreso nuevo.
          nombre_y_apellido_paciente: Nombre y apellido del paciente que va a recibir el tratamiento o la internación.

          1. Usa exclusivamente el historial de la conversación para extraer estos campos.
          2. No adivines ni inventes información.
          3. Email, Obra_social y Tipo_de_tratamiento , full_name, Last_name , son obligatorios:
            - Si falta uno de ellos, y el usuario te hace un preguna sobre otro tema entonces responde a la pregunta de manera natural y luego vuelve a preguntar por el dato que falta.
             
          4. el campo (Nombre_y_Apellido_paciente) son opcionales; si no se menciona, déjalo en blanco y sigue.

          ### REGLA ESTRICTA:
          - No brindes ninguna información por fuera del contexto de esta conversación, si alguna pregunta no la sabes di que en un momento luego de recopilar la información vas a poder ayudarlo.
          - No respondas a preguntas que no tengan que ver con la consulta del paciente o familiar.
          - No respondas sobre médicos, ni horarios de atención, ni información general para la estadía del paciente en IMAR.
          - No respondas sobre información de la web, ni de la institución.
          - No respondas sobre obra sociales ni coberturas.
          - Conversa amablemente, responde a las preguntas que puedas y recuerda que el objetivo es ayudar al paciente o familiar a gestionar su consulta primero que nada recopilando información.

          `

          const humanMessage = `Aqui está la conversación completa hasta ahora:\n${formatMessages(state.messages)}`;

          const response = await modelExtraction.invoke([
            { role: "system", content: prompt },
            { role: "human", content: humanMessage },
          ]);

          console.log("Response: ", response);  
          
        
          const toolCall = response.tool_calls?.[0];
          console.log("ToolCall: ", toolCall);
          
          if (!toolCall) {
            return {
              messages: [response],
            };
          }

          const extractedDetails = toolCall.args as z.infer<typeof schema>;
          const { Full_Name, Email, Obra_social, Tipo_de_tratamiento, Last_Name } = extractedDetails;
          if(!Full_Name || !Email || !Obra_social || !Tipo_de_tratamiento || Last_Name ){
            return {
              messages: [`Sólo me falta algo de información para poder ayudarte, por favor completame los siguientes datos ${Full_Name == null ? "nombre completo" : "" } , ${!Email ? "email" : ""} , ${!Obra_social ? "obra social" : ""} , ${!Tipo_de_tratamiento ? "tipo de tratamiento" : ""} , ${!Last_Name ? "apellido del paciente" : ""}` ]
            };
          }


      


          const extractToolResponse = new ToolMessage("Muy bien, con estos datos podemos continuar con la conversación", toolCall?.id as string, 
            toolCall.name    
          );

          console.log("ExtractDetails: ", extractedDetails);

          const resLoadLead = await load_lead({lead: extractedDetails})
          if(resLoadLead) return isNew = false

          if(Tipo_de_tratamiento === "Consultorio externo"){
            isConsultrioExterno = true
          }

          return new Command({
            // state update
            update: {
              messages: [ response , extractToolResponse],
              consultorio_externo: isConsultrioExterno,
              isNew_patient: isNew,
              info_paciente: {
                full_name: extractedDetails.Full_Name,
                Last_Name: extractedDetails.Last_Name,
                email: extractedDetails.Email,
                obra_social: extractedDetails.Obra_social,
                tipo_de_tratamiento: extractedDetails.Tipo_de_tratamiento,
                nombre_y_apellido_paciente: extractedDetails.Nombre_y_Apellido_paciente,
                phone: cel_number
              },
            },
            // control flow
            // goto: "myOtherNode",
          });

         

}


function routeAfterExtraction(
  state: typeof subgraphAnnotation.State
): "agent" | "__end__" | "consultorio_externo" {
  console.log("routeAfterExtraction: es nuevo? ", isNew);
  
  // Si es nuevo sigue extrayebdo datos
  if (!isNew) {
    return "agent";
  }

  // De otra manera va hacia el agente a seguir la consulta
  return "__end__";
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

// const consultorio_externo = async (state: typeof subgraphAnnotation.State) => {
//   const { messages, info_paciente } = state;

//   const conversation = formatMessages(messages);

//   const prompt = `Como asistente de IMAR, debes ayudar al paciente a gestionar su turno con consultorios externos
//     ésta persona ya viene siendo atendida por un agente, por eso voy a compartirte la conversacion completa hasta ahora:
//     ${conversation}
//     La persona que se contacta es ${info_paciente.Full_name} y su obra social es ${info_paciente.obra_social}
//     Debes resolver las dudas sobre consultorios externos y turnos, si no sabes algo no respondas, sólo responde lo que sabes.
//     vas a tener a disposiscion una herramienta para verificar si la obra social tiene convenio con IMAR, si no lo tiene entonces vas a tener que ofrecerle una consulta particular.
//   `

// }

const graph = new StateGraph(subgraphAnnotation);

graph

  .addNode("agent", callModel)
  .addNode("extraction", extractInfo)
  // .addNode("consultorio_externo", consultorio_externo)
  .addNode("tools", toolNode)
  .addConditionalEdges(START, routeStart, ["extraction", "agent"])
  .addConditionalEdges("extraction", routeAfterExtraction, ["agent", "__end__"])
  .addConditionalEdges("agent", checkToolCall)
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
