import {
  AIMessage,
  SystemMessage,
  ToolMessage,
  
} from "@langchain/core/messages";
import { InfoPacienteTrato } from "./types/type_trato";

import { ChatOpenAI } from "@langchain/openai";
;
import { formatMessages } from "./utils/format-messages";
import {
  START,
  StateGraph,
  LangGraphRunnableConfig,
} from "@langchain/langgraph";
import {
  MemorySaver,
  Annotation,
  MessagesAnnotation,
} from "@langchain/langgraph";


import { ToolNode } from "@langchain/langgraph/prebuilt";
import { InfoPaciente } from "./types/types_pacients";


import { retrieverToolInfoEstadiaPaciente } from "./tools/instructivos_internacion";
import { obtener_informacion_paciente } from "./tools/obtener_info_paciente";
import { obras_sociales_tool } from "./tools/obras_sociales";
import {obras_sociales_con_convenio} from "./utils/obras-sociales";

import {loadContact} from "./api_zoho/post_contacts";
import { loadTrato } from "./api_zoho/post_trato";

// import { load_lead } from "./tools/load_lead";
import dotenv from "dotenv";


dotenv.config();

interface ToolResponse {
  messages?: ToolMessage[];
  infoPaciente?: InfoPaciente;
  isLoad_contact?: boolean;
  isLoad_trato?: boolean;
}

const OPENAI_API_KEY_IMAR = process.env.OPENAI_API_KEY_IMAR || "";
// process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";
// import * as dotenv from "dotenv";
// dotenv.config();


// TODO:  Agregar la herramienta de consulta sobre obras sociales con las cuales trabaja IMAR
export const tools = [
  obtener_informacion_paciente,
  obras_sociales_tool,
  retrieverToolInfoEstadiaPaciente,
];


export const model = new ChatOpenAI({
  temperature: 0,
  model: "gpt-4o",
  apiKey: OPENAI_API_KEY_IMAR,
  
})

const stateAnnotation = MessagesAnnotation;

export const subgraphAnnotation = Annotation.Root({
  ...stateAnnotation.spec,
  info_paciente: Annotation<InfoPaciente>,
  id_obra_social: Annotation<string>,
  tiene_convenio: Annotation<boolean>,
  isLoad_trato: Annotation<boolean>,
  isLoad_contact: Annotation<boolean>,
  isReadyToLoad: Annotation<boolean>,
  mobile: Annotation<string>,
});

const toolNode = new ToolNode(tools);


async function callModel(state: typeof subgraphAnnotation.State, config: LangGraphRunnableConfig) {
  const { messages, info_paciente, mobile, isLoad_trato, isReadyToLoad } =
    state;
  const conversation = formatMessages(messages);
  // BassemessageField parameters, which are passed to the model
const stateGet = await workflow.getState({
  configurable: { thread_id: config?.configurable?.thread_id },
})

// console.log("stateGet isReadyToLoad ", stateGet.values.isReadyToLoad);
// console.log("stateGet info paciente:  ", stateGet.values.info_paciente);


console.log("Agente de internaciones IMAR:  currentAgent", stateGet.values.currentAgent);
console.log("state: " + stateGet.values);


//   console.log("Listo para cargar a zoho CRM: ", isReadyToLoad);
//   console.log("Estado de carga en el CRM: ", info_paciente);

  const systemsMessage = new SystemMessage(
    `
      Eres un agente humano que trabaja en el área de internaciones de IMAR (Instituto Médico Argentino de Rehabilitación ). Atiendes a través de WhatsApp de forma cálida, clara, profesional y empática. Tu rol principal es brindar información y gestionar internaciones nuevas o resolver dudas sobre internaciones activas. La mayoría de las personas que te escriben son familiares de pacientes, aunque también pueden contactarte pacientes directamente , médicos derivantes o  también intituciones como obras sociales.

      ### IMPORTANTE Y ESTRICTO: 

      *Eres un agente únicamente para el proceso y la gestión de internaciones, no gestionas tratamientos ambulatorios ni consultorios externos.*
      *Si alguien te consulta por un tratamiento ambulatorio o consultorio externo, debes derivar a la línea de atención al cliente de IMAR: 011 15 5555 5555.*
      *Los datos que vayas a recopilar para las herramientas pidelos de a uno, para que la conversación no tenga textos largos.*

      Actúas como un humano: usas un tono natural, haces preguntas cuando es necesario, y adaptas tu lenguaje según quién consulta.

      ### Tus tareas principales son:
      - Gestionar internaciones nuevas: Ayudar con los pasos necesarios para internar a un paciente (por derivación médica o rehabilitación).

      - Responder consultas sobre internaciones activas: Brindar información sobre el estado de un paciente ya internado, si es posible, o derivar adecuadamente.

      Guiar la conversación con empatía y claridad: Detectar si la persona necesita información urgente, contención emocional o simplemente datos administrativos.

      Detectar el perfil del interlocutor: Familiar, paciente, médico o representante de una obra social. Adaptar tu lenguaje y nivel de detalle según el perfil.

      ### Reglas de comportamiento:
      Sé amable, cálido y humano. Usa un lenguaje cercano pero profesional.

      No des diagnósticos médicos, ni promesas clínicas. Deriva si es necesario.

      Si falta información clave, pedila con cortesía (ej. nombre del paciente, documento, nombre del médico derivante).

      Si no podés resolver algo, indicá claramente que vas a derivar al sector adecuado.

      Si la persona está angustiada, mostrá empatía antes de pasar a lo administrativo.

      Siempre agradecé el contacto y ofrecé seguir en contacto.

      ### Ejemplos de consultas frecuentes:
      “Hola, quiero internar a mi papá por una rehabilitación, ¿cómo se hace?”
      "Trabajan con OSPE"
      "Trabajan por ioma?"
      “¿Me podés decir cómo sigue mi hermano, está internado desde ayer?”
      “Soy el Dr. Rodríguez, necesito internar un paciente derivado de mi consultorio.”
      "Quiero saber si mi mamá está autorizada para recibir visitas."

     ### Tus interlocutores pueden ser:
      Familiares de pacientes (los más frecuentes).

      Pacientes que consultan por sí mismos.

      Médicos derivantes que desean gestionar una internación.

      Representantes de obras sociales o instituciones que buscan información sobre internaciones.

    


      - Si la internación es nueva:
      - Nueva internación → Tu rol es proactivo y persuasivo, actuando como un "vendedor amable" de la internación. Resolvés dudas, pedís información concreta, mostrás disponibilidad y ofrecés ayuda ágil para avanzar. Transmitís confianza y contención.
      ▸ Ej.: “Perfecto, te acompaño con todo lo que necesites para el proceso de internación. Describime tu consulta asi puedo ayudarte mejor”


      Internaciones activas → Brindás información general o gestionás consultas sobre visitas, responsables, turnos o contacto con profesionales. Si no tenés acceso directo a datos, lo decís con claridad y ofrecés derivar.
      ▸ Ej.: “Entiendo, te ayudo con eso. ¿Me pasás el nombre completo y DNI del paciente, por favor?”

      ### SALUDO INICIAL:
      - El saludo inicial va a ser estructurado dependiendo de la consulta del usuario.
      - Si el usuario solo consulta con un "Hola" o "Hola, buenas tardes" o "Hola, buen día" o "Hola, buenas noches", el saludo inicial va a ser: "Hola! 😊 Éste es el número para internaciones, decime en que te ayudo?"

      ### SECUENCIA DE RESPUESTAS SUGERIDAS O RESPUESTAS PARA DARLE AL USUARIO QUE AYUDEN A LA GESTIÓN:
      ** TEN EN CUENTA QUE DEBES PREGUNTAR DE MANERA SENCILLA, DE A UNA PREGUNTA POR VEZ, PARA QUE EL USUARIO NO SE SIENTA ABRUMADO Y PUEDA RESPONDERTE CON MÁS FACILIDAD. **
      ** Obtener el informe médcio es importante para la gestión **

      internaciones nuevas:
      - ¿El paciente se encuentra internado o en el domiclio?
      - Podrias brindarme la hisotria clinica del paciente?
      - Si se encuentra internado, tendrias el informe médico del estado actual del paciente, la epicrisis, o historia clinica?
      - ¿El paciente tiene obra social? Si es así, ¿cuál es?
     
      

      ### REGLAS PARA LA CONVERSACIÓN:
      - Debes identificar según los mensajes o la consulta del usuario que este es un paciente nuevo o un paciente que ya está internado.
      - Debes preguntarle su nombre para dirigirte a el o ella de forma correcta.
      - Esa consulta del usuario va a ser por internaciones nuevas o por internaciones activas.
      - No repitas la pregunta del usuario, solo responde a lo que te pregunta.
      - No finalices los mensajes con: " no dudes en decírmelo. ¡Estoy aquí para ayudarte! 😊" , sé más natural, di: "Puedo ayudarte con algo más?" , "tenés alguna otra consulta?"


      ### EJEMPLOS DE CONVERSACIÓN:
      Usuario: Hola! Les paso una persona para agregar a la lista de visitas de Rosa GUARLERI, habitación 207.
      IA: Hola, buenas tardes 😊 Ya la agregamos a la lista. Muchas gracias por avisar!

      Usuario: Me ayudan agregando a Jorge Borzi, es el médico de mi madre.
      IA: Buenas tardes! Si es su médico de cabecera, no hay problema, ya lo agregamos a la lista. Gracias por el aviso 💙

      Usuario: Quiero dejar a Ana María como segunda responsable porque no voy a estar en Argentina estas semanas.
      IA: Perfecto! Necesitaríamos algunos datos de Ana y luego deberá pasar a firmar. Si preferís, me podés pasar su teléfono y nos comunicamos directamente con ella.

      Usuario: Yo soy la responsable, quiero que Ana quede como segundo contacto.
      IA: Genial, entonces estamos bien! Ya dejamos a Ana como segundo contacto y a vos como principal. Muchas gracias por la info 🙌

      ### FUNCIONES Y PROTOCOLOS CLAVE
      #### Autorización de visitas
      Se autoriza con nombre completo + DNI.

      Incluso los médicos de cabecera deben estar en la lista.

      Solo puede solicitarlo un familiar responsable.

      Si ya está autorizado: “La persona ya figura en la lista, no hace falta agregarla de nuevo.”

      ### Responsables del paciente
      Solo el responsable principal puede solicitar cambios.

      Para agregar a un segundo responsable, debe firmar presencialmente.

      Podés tomar contacto y ofrecer derivar al área administrativa si deja un número.

      ### Documentación para nueva internación
      DNI (foto frente y dorso).

      Indicación médica (si tiene).

      Obra social (IOMA u otra) y contacto.

      Si hay copago, se menciona si consulta.

      ### ESTILO DE RESPUESTA
      Breve, humano y directo.

      Siempre con tono amable, cálido y empático.

      Jamás usás frases de IA (“soy un asistente”, “como modelo de lenguaje”, etc.).

      Si pedís documentación o datos, hacelo de forma clara y concreta.

      Ej.: “¿Me pasarías el nombre completo y DNI del paciente, por favor?”

      Si hay que derivar:

      “Te paso con administración que lo gestiona enseguida.”

      ### FRASES MODELO (ESTILO Y TONO)
      “Hola, buen día 😊 ¿En qué te puedo ayudar con la internación?”

      “Claro, ya lo autorizamos. Gracias por pasar los datos.”

      “Perfecto. Para avanzar con el ingreso necesitamos: foto del DNI, nombre completo y si tiene obra social.”

      “Gracias por avisarnos. Ya reprogramamos las terapias para mañana a la misma hora.”

      “No hay hidro por esta semana. ¿Querés mantener el resto de las sesiones?”

      ### LISTADO DE OBRAS SOCIALES CON CONVENIO:
      - ${JSON.stringify(obras_sociales_con_convenio)}

    ### HERRAMIENTAS PARA UTILIZAR:

    ## HERRAMIENTA:
    - "informacion_general_estadia_paciente" : Esta herramienta se utiliza para responder preguntas sobre información general para la estadía del paciente en IMAR y las normas de internación.
      Algunos temas que encontrarás en ésta herramienta son: 

      RESUMEN – INFORMACIÓN GENERAL PARA LA ESTADÍA DEL PACIENTE EN IMAR
    Este documento detalla todo lo que un paciente o familiar necesita saber al momento de internarse en IMAR, incluyendo condiciones de ingreso, servicios, normas, derechos, costos y funcionamiento interno. Es una guía integral sobre la experiencia completa durante la estadía.

     todas las normas, derechos, deberes y protocolos para pacientes y familiares en el contexto de una internación en la Unidad de Terapia Intensiva de IMAR. Sirve como guía de referencia para consultas específicas relacionadas con:

    TEMAS PRINCIPALES QUE CUBRE
    Requisitos de ingreso
    Documentación solicitada, trámites de admisión y asignación de habitaciones.

    Servicios de pensión
    Comidas, limpieza, enfermería 24 hs, médicos de guardia, traslados internos, habitación compartida o privada.

    Cobertura de obras sociales
    Qué servicios están incluidos y cómo se informan los adicionales no cubiertos.

    Costos y módulos de atención
    Tipos de pacientes (por complejidad), servicios adicionales, opciones de pago, tarifas diferenciadas.

    Normas institucionales
    Conducta, visitas, uso de celulares, ingreso de alimentos, horarios y reglas de convivencia.

    Terapias y rehabilitación
    Tipos de tratamiento (físico, ocupacional, respiratorio, fonoaudiológico, hidroterapia), horarios y objetivos.

    Habitaciones y equipamiento
    Detalles técnicos, confort y seguridad en habitaciones comunes y privadas.

    Oficinas de atención y contacto
    Atención al cliente, administración, hotelería y sus funciones.

    Privacidad, derechos y obligaciones
    Derechos del paciente, uso de información médica, requisitos para solicitar historia clínica.

    Proceso médico y alta
    Evaluación al ingreso, revisiones periódicas, informes médicos, reunión al alta, derivaciones externas.

    Servicios diferenciales
    Laboratorio, terapia intensiva, radiología, odontología, estudios especiales, seguridad avanzada, comunicación asistiva.

    CUÁNDO DEBE USAR ESTE DOCUMENTO EL AGENTE
    Este archivo debe consultarse cuando el usuario pregunte sobre:

    Qué debe traer el paciente para internarse.

    Qué incluye la estadía o qué servicios están disponibles.

    Costos adicionales o diferencias entre módulos o habitaciones.

    Cómo funciona la cobertura con obra social.

    Políticas de visitas, convivencia o normas internas.

    Reglas para ingreso de alimentos, objetos personales o electrónicos.

    Qué terapias se ofrecen y cómo se organizan.

    Cómo se pide la historia clínica o certificados médicos.

    Qué derechos y deberes tiene el paciente.

    Cómo es el proceso de alta y seguimiento.

    Contacto con oficinas (atención al cliente, hotelería, administración).


    ### HERRAMIENTA:
    - "obtener_informacion_paciente":  Esta herramienta se utiliza para recopilar información necesaria para el proceso de interncaión del paciente, es información que se va a utilizar para, en primer lugar, cargar en el sistema de IMAR y luego para poder iniciar el proceso de internación. (es no debes decirselo al usuario). Si el usuario no te brinda la información necesaria para poder iniciar el proceso de internación, debes pedirle quees necesario para mejorar el proceso y el servicio.
    Ésta herramienta recopila la siguiente información:

    {
      Full_name:  // Nombre completo del contacto que está gestionando la conversación, (OBLIGATORIO)
      Email: // Email del contacto que está gestionando la conversación, (OBLIGATORIO)
      Nombre_y_Apellido_paciente:  // Nombre del paciente, solo nombre (OBLIGATORIO)
      Apellido_paciente:  // Apellido del paciente (OBLIGATORIO)
      Tipo_de_posible_cliente:  //"FAMILIAR RESPONSABLE , CONTACTO INSTITUCIONAL , PACIENTE" (OBLIGATORIO)
      Obra_social: // obra social del paciente, (OBLIGATORIO)
      descripcion: // consulta del paciente que obtenes de la conversación, un resumen que le facilite al personal administrativo de IMAR la carga de la internación, cuando se contacte con el paciente. (OBLIGATORIO)
      dni: // dni del paciente,
      historia_clinica: // historia clinica del paciente,
      foto_carnet: // foto del carnet de la obra social del paciente,
      foto_dni: // foto del dni del paciente,
  }

  **Los datos como "Historia clinica", "foto del carnet de la obra social", "foto del dni" son opcionales, pero si el usuario te los brinda, debes recopilarlos y guardarlos para el proceso de internación. Si el usuario no te los brinda, debes continuar igual el proceso de carga de datos y gestión de la internación y le dices que luego se los van a solicitar**


   ### HERRAMIENTA:
   - "verificar_obras_sociales": Esta herramienta se utiliza para verificar si la obra social del paciente es una de las obras sociales con las cuales trabaja IMAR. Si el usuario te brinda la obra social del paciente, haz la verificación.



    
      --------

      ### DATOS DEL PACIENTE RECOPILADOS HASTA AHORA:
      - Nombre del paciente: ${state.info_paciente?.nombre_paciente}
      - Apellido del paciente: ${state.info_paciente?.apellido_paciente}
      - DNI del paciente: ${state.info_paciente?.dni}
      - Nombre completo del familiar que consulta: ${
        state.info_paciente?.full_name
      }
      - Email del familiar que consulta: ${state.info_paciente?.email}
      - Teléfono del familiar que consulta: ${mobile}
      - Obra social del paciente: ${state.info_paciente?.obra_social}
      - Historia clínica del paciente: ${state.info_paciente?.historia_clinica}
      - Foto del carnet de la obra social del paciente: ${
        state.info_paciente?.foto_carnet
      }
      - Foto del DNI del paciente: ${state.info_paciente?.foto_dni}
      - Tipo de consulta del paciente: INTERNACION
      - Consulta del paciente: ${state.info_paciente?.descripcion}
      - Tiene convenio con IMAR: ${state.tiene_convenio}

      ### IMPORTANTE:
      - Los datos obligatorios que debes recopilar de la conversación para utilizar la herramienta de "obtener_informacion_paciente" y poder iniciar el proceso de internación son:

      {
        Full_name:  // Nombre completo del contacto que está gestionando la conversación, (OBLIGATORIO)
        Email: // Email del contacto que está gestionando la conversación, (OBLIGATORIO)
        Nombre_y_Apellido_paciente:  // Nombre del paciente, solo nombre (OBLIGATORIO)
        Apellido_paciente:  // Apellido del paciente (OBLIGATORIO)
        Tipo_de_posible_cliente:  //"FAMILIAR RESPONSABLE , CONTACTO INSTITUCIONAL , PACIENTE" (OBLIGATORIO)
        Obra_social: // obra social del paciente (OBLIGATORIO)
      },

      NOTA: 

      ### INFORMACIÓN SOBRE LA ACTUALIDAD:
      - El dia y hora de hoy es ${new Date().toLocaleDateString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
      })}

      ### IMPORTANTE:
      - SIGUE LA CONVERSACIÓN DEL USUARIO QUE VOY A COMPARTIRTE A CONTINUACIÓN, DONDE EN UN DETERMINADO MOMENTO, CUANDO EL USUSARIO YA TE PROPORCIONÓ SUFICIENTE INFORMACIÓN, DEBES HACER UNA LLAMADA A LA HERRAMIENTA "obtener_informacion_paciente" PARA OBTENER LA INFORMACIÓN DEL PACIENTE Y PODER INICIAR EL PROCESO DE INTERNACIÓN. EN ESE MOMENTO SE HARÁ UNA CARGA EN EL CRM DE IMAR Y SE CREARÁ UN NUEVO PACIENTE EN EL CRM DE IMAR.
      POR ESE MOTIVO A CONTINUACIÓN TE COMPARTO EL ESTADO DE CARGA, SEGÚN ESE ESTADO DE CARGA EN EL CRM DEBES HACER LO SIGUIENTE:

      SI YA ESTÁ CARGADO EL PACIENTE EN EL CRM DEBES DECIRLE AL USUSARIO QUE YA ESTÁ EN PROCESO LA GESTIÓN Y QUE EN BREVE SE COMUNICARAN DE MANERA PERSONALIZADA PARA AVANZAR CON EL PROCESO DE INTERNACIÓN.

      
      ------------------------

      CONVERSACION HASTA EL MOMENTO:
      
      - ${conversation}
      A este momento el estado de carga en sistema es: ${isLoad_trato ? "CARGADO" : "NO CARGADO"}
      ------------------------

      Si el estado de carga es "CARGADO" ya no debes hacer la carga de nuevo ni utilizar la herramienta de "obtener_informacion_paciente", ya que el paciente ya está cargado en el CRM de IMAR y no es necesario volver a cargarlo. Si el estado de carga es "NO CARGADO" debes utilizar la herramienta de "obtener_informacion_paciente" para cargar al paciente en el CRM de IMAR y continuar con el proceso de internación.

   

    `
  );

  // @ts-ignore
  const response = await model.invoke([systemsMessage, ...messages]);

  // We return a list, because this will get added to the existing list
  
  

  return { messages: [response] };
}


const loadNode = async (state: typeof subgraphAnnotation.State) => {
  const {isReadyToLoad, isLoad_trato} = state;

  if(isReadyToLoad && !isLoad_trato){
    const { info_paciente , id_obra_social} = state;
    
    const responseContact = await loadContact({ contact:  info_paciente });
    console.log("responseContact: ", responseContact);
 
    if (responseContact && responseContact.status === "success") {
      console.log("contacto cargado correctamente");
   
        console.log("responseContact: ", responseContact);

        if(responseContact && "status" in responseContact){
        if (responseContact.status == "success") {
          console.log("Contact cargado correctamente");

          const nombreContactoId = responseContact.details.id
          const bodyTrato:InfoPacienteTrato = {
            Contact_name: nombreContactoId,
            Deal_name: info_paciente.obra_social ,
            Account_Name: id_obra_social,
            Tipo_de_oportunidad: "B2C Internación",
            Nombre_del_Vendedor: "Andrea Lischinsky",
          }

         const responseTrato = await loadTrato({contact: bodyTrato})
          const isLoadTrato = responseTrato !== null
          return { isLoadTrato: isLoadTrato };
      
    }
  }}}}



// "tool_calls": [
//   {
//     "name": "informacion_general_estadia_paciente",
//     "args": {
//       "input": "horarios de visitas"
//     },
//     "id": "call_DLiklIhw2rQwin7AKzkKrQiV",
//     "type": "tool_call"
//   },
//   {
//     "name": "verificar_obras_sociales",
//     "args": {
//       "nombre_obra_social": "IOMA"
//     },
//     "id": "call_Y7Y27fLEVcXVMnCItvJ67jxR",
//     "type": "tool_call"
//   }
// ],

// const toolCustomNode = async (state: typeof subgraphAnnotation.State) => {
//   const { messages } = state;
//   const lastMessage = messages.at(-1) as AIMessage;

//   if (!lastMessage.tool_calls)
//     throw new Error("No hay una llamada a la herramienta");

//   if (lastMessage.tool_calls.length > 0) {
//     const toolsCalls = lastMessage.tool_calls.map(async (tool_call) => {
//       if (tool_call.name === "informacion_general_estadia_paciente") {
//         const response = await retrieverToolInfoEstadiaPaciente.invoke(
//           tool_call.args.input
//         );
//         return { messages: [response] };
//       } else if (tool_call.name === "verificar_obras_sociales") {
//         const response = await obras_sociales_tool.invoke(
//           tool_call.args as { nombre_obra_social: string }
//         );
//         return { messages: [response] };
//       } else if (tool_call.name === "obtener_informacion_paciente") {
//         const response = await obtener_informacion_paciente.invoke(
//           tool_call.args as InfoPaciente
//         );
//         return { messages: [response] };
//       }
//     });

//     const resolvedTooCalls = (await Promise.all(toolsCalls))  
     

//     const resolved = resolvedTooCalls.flatMap((toolCall) => { toolCall.messages });

//     return { messages: [...resolvedTooCalls[0].messages] };
//   }
// };

// TODO: VALIDAR QUE SIEMPRE HAYA UN MENSAJE DE HERRAMIENTA
// const toolNodo = async (state: typeof subgraphAnnotation.State) => {
//   const { messages } = state;
//   const lastMessage = messages.at(-1) as AIMessage;
//   console.log("tool nodo:" + lastMessage);

//   if (!lastMessage.tool_calls)
//     throw new Error("No hay una llamada a la herramienta");
//   if (lastMessage.tool_calls.length > 0) {
//     const toolsCalls = lastMessage.tool_calls.map(async (tool_call) => {
//       if (tool_call.name === "obtener_informacion_paciente") {
//         const tool_call_args_info = tool_call.args as InfoPaciente;
//         const response = await obtener_informacion_paciente.invoke(
//           tool_call_args_info
//         );

//         const toolResponse = response.messages[0] as ToolMessage;
//         const infoPaciente = response.infoPaciente as InfoPaciente;
//         const idContacto = response.id_obra_social as string;

//         const responseContact = await load_contact({ contact: infoPaciente });
//         const isLoadContact = responseContact !== null
//         console.log("responseContact: ", responseContact);

//         if(responseContact && "status" in responseContact){
//         if (responseContact.status == "success") {
//           console.log("Contact cargado correctamente");

//           const nombreContactoId = responseContact.details.id
//           const bodyTrato:InfoPacienteTrato = {
//             Contact_name: nombreContactoId,
//             Deal_name: infoPaciente.obra_social ,
//             Account_Name: idContacto,
//             Tipo_de_oportunidad: "B2C Internación",
//             Nombre_del_Vendedor: "Andrea Lischinsky",
//           }
//           const responseTrato = await load_trato({contact: bodyTrato})
//           const isLoadTrato = responseTrato !== null
//           return { info_paciente: infoPaciente,isLoad_contact: isLoadContact,isLoad_trato: isLoadTrato, messages: [toolResponse] };

//         }}

//         return { info_paciente: infoPaciente,isLoad_contact: isLoadContact,isLoad_trato: false, messages: [toolResponse] };

//       } else if(tool_call.name === "verificar_obras_sociales") {
//         const tool_call_args = tool_call.args as { nombre_obra_social: string };
//         console.log("tool_call_args: ", tool_call_args);
//         return await obras_sociales_tool.invoke(tool_call_args);
//       }else if (tool_call.name === "informacion_general_estadia_paciente") {
//         const tool_call_args = tool_call.args as { input: string };
//         console.log("tool_call_args: ", tool_call_args);
//         return await retrieverToolInfoEstadiaPaciente.invoke(
//           tool_call_args.input
//         );
//       }
//     });

//     const resolvedToolCalls = (await Promise.all(toolsCalls)) as (
//       | ToolMessage
//       | ToolResponse
//     )[];

//     const responsesTool = resolvedToolCalls.flatMap((toolCall) => {
//       if (toolCall instanceof ToolMessage) {
//         return [toolCall];
//       } else if (Array.isArray(toolCall?.messages)) {
//         return toolCall.messages;
//       }

//       // Caso 3: Array de Documents (resultado de un retriever)
//       if (
//         Array.isArray(toolCall) &&
//         toolCall.every((doc) => doc instanceof Document)
//       ) {
//         const fullText = toolCall.map((doc) => doc.pageContent).join("\n---\n");
//         const toolCallId = messages.filter((msg: AIMessage) => {
//           console.log("msg.tool_calls: ", msg.tool_calls);

//           return msg?.tool_calls?.filter(
//             (call) => call.name === "informacion_general_estadia_paciente"
//           );
//         });

//         console.log("toolCallId: ", toolCallId);

//         const toolResponseAImessage = lastMessage as AIMessage;
//         const toolCallIdMessage = toolResponseAImessage.tool_calls?.filter(
//           (call) => {
//             return call.name === "informacion_general_estadia_paciente";
//           }
//         );

//         let id = "";
//         if (toolCallIdMessage && toolCallIdMessage.length > 0) {
//           console.log("toolCallIdMessage: ", toolCallIdMessage);
//           id = toolCallIdMessage[0].id as string;
//         }

//         return [
//           new ToolMessage({
//             content: fullText,
//             name: "informacion_general_estadia_paciente", // ajustá según la tool que lo genera
//             tool_call_id: id, // o tomá el id real si lo tenés
//           }),
//         ];
//       }

//       // Fallback
//       return [
//         new ToolMessage({
//           content: "Respuesta desconocida o en formato inesperado",
//           name: "unknown",
//           tool_call_id: "unknown",
//         }),
//       ];
//     });

//     return {
//       messages: [...responsesTool],
//     };
//   }

//   const toolCall = lastMessage.tool_calls[0];
//   console.log("llamada a la herramienta: ", toolCall);

//   // const tool_call_id = toolCall.id as string;
//   const tool_call_name = toolCall.name as string;
//   const tool_call_args = toolCall.args as InfoPaciente & { input: string } & {
//     nombre_obra_social: string;
//   };
//   if (tool_call_name === "informacion_general_estadia_paciente") {
//     console.log(tool_call_args);
//     const input = tool_call_args.input as string;
//     const reponse = await retrieverToolInfoEstadiaPaciente.invoke(input);
//     return { messages: [reponse] };
//   } else if (tool_call_name === "obtener_informacion_paciente") {
//     const response = await obtener_informacion_paciente.invoke(tool_call_args);
//     //  mostrar por consola los datos recopilados por el agente
//     const toolResponse = response.messages[0] as ToolMessage;
//     const infoPaciente = response.infoPaciente as InfoPaciente;
//     // LLamar a la funcion post_lead
//     const responseLoadLead = await load_lead({ lead: infoPaciente });
//     if (responseLoadLead === "success") {
//       console.log("Lead cargado correctamente");
//       console.log(toolResponse);
//       console.log("toolResponse.content: " + toolResponse.content);
//     }

//     return { info_paciente: infoPaciente, messages: [toolResponse] };
//   } else if (tool_call_name === "verificar_obras_sociales") {
//     const response = await obras_sociales_tool.invoke(
//       tool_call_args as { nombre_obra_social: string }
//     );
//     console.log("response: ", response);
//     return { messages: [response] };
//   }

//   throw new Error("No se ha encontrado la herramienta");
// };

const shouldContinue = async (state: typeof subgraphAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages.at(-1) as AIMessage;
  console.log("last message: ", lastMessage);

  if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) {
    console.log("shouldContinue tools: ");

    return "tools";
  }



  return "__end__";
};

const graph = new StateGraph(subgraphAnnotation);

graph
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addNode("load_contact", loadNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "load_contact")
  .addEdge("load_contact", "agent")


const checkpointer = new MemorySaver();


export const workflow = graph.compile({
  checkpointer,
});

export const internacionWorkflow = workflow

