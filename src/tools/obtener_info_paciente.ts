import { tool } from "@langchain/core/tools";
import {buscarIdObraSocialImar} from "../utils/get_id_obra_social";
import { info_paciente_schema, InfoPaciente } from "../types/types_pacients";
import { ToolMessage } from "@langchain/core/messages";
import { workflow } from "../graph";

export const obtener_informacion_paciente = tool(
  async (
    {
      descripcion,
      tipo_de_posible_cliente,
      dni,
      foto_carnet,
      foto_dni,
      obra_social,
      historia_clinica,
      email,
      full_name,
      nombre_paciente,
      apellido_paciente,
    }: InfoPaciente,
    config
  ) => {
    const state = await workflow.getState({
      configurable: { thread_id: config.configurable.thread_id },
    });

    console.log("tool obtener_informacion_paciente");

    const { messages, mobile } = state.values;
    const tool_call_id = messages.at(-1)?.tool_calls.at(-1)?.id;

    if (
      !email ||
      !obra_social ||
      !nombre_paciente ||
      !apellido_paciente ||
      !tipo_de_posible_cliente
    ) {
      // return {messages: [new ToolMessage(`Faltan algunos datos para poder ayduarte mejor:  ${!dni ? "DNI, " : ""} , ${!obra_social ? "Obra social, " : ""} , ${!nombre_paciente ? "nombre, " : ","}  ${!apellido_paciente ? "Apellido del paciente, " : ""}  ${!nombre_paciente ? "Nombre del paciente," : ","}  `, tool_call_id, "obtener_informacion_paciente")]}

      throw new Error(
        `Faltan algunos datos para poder ayudarte mejor:  ${
          !email ? "Email, " : ""
        } ${!obra_social ? "Obra social, " : ""} ${!nombre_paciente ? "Nombre del paciente, " : ""} ${!apellido_paciente ? "Apellido del paciente, " : ""} ${!dni ? "DNI, " : ""} ${!tipo_de_posible_cliente ? "Si eres familiar, contacto institucional o paciente, " : ""} `
      );
    }

    const responseObraSocialMap = await buscarIdObraSocialImar(obra_social);

    const {id} = responseObraSocialMap;


    const infoPaciente = {
      descripcion,
      telefono: mobile,
      tipo_de_tratamiento: "INTERNACION",
      tipo_de_posible_cliente,
      dni,
      foto_carnet,
      foto_dni,
      obra_social,
      id_obra_social: id || "4725123000001549012", // 
      historia_clinica,
      email,
      full_name,
      nombre_paciente,
      apellido_paciente,
    };

    const message = `Hemos obtenido la siguiente informacón del paciente:
    ${JSON.stringify(infoPaciente, null, 2)}
    Por favor, revisa que la información sea correcta. Si es así, por favor sube los documentos solicitados para continuar con el proceso de internación.
   `;
    return {
      infoPaciente,
      messages: [
        new ToolMessage(message, tool_call_id, "obtener_informacion_paciente"),
      ],
    };
  },
  {
    name: "obtener_informacion_paciente",
    description:
      "Ésta herramienta se utiliza para obtener la información necesaria del paciente y familiar para poder iniciar el proceso de internación",
    schema: info_paciente_schema,
  }
);

// ESTO SE PUEDE USAR EN LAS VALIDACIONES A TRAVES DE ZOD PARA LAS HERRAMIENTAS
// const propiedad = z.object({
//   direccion: z.string().describe("Dirección completa del inmueble"),
//   precio: z.number().describe("Precio de venta en euros"),
// });

// const schema = z.object({
//   propiedades: z.array(propiedad).describe("Lista de propiedades a mostrar al cliente"),
// });

// ✅ 3. Usar .transform() si querés que el valor fijo se agregue automáticamente
// Otra opción avanzada es usar .transform() para agregar el valor fijo después del parseo:

// ts
// Copy
// Edit
// const schema = z.object({
//   nombre: z.string().describe("Nombre del paciente"),
// }).transform((data) => ({
//   ...data,
//   origen: "AGENTE_AI",
// }));
// 🔸 En este caso, cualquier schema.parse() ya va a incluir "origen": "AGENTE_AI" automáticamente.
