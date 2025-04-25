import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  obras_sociales_con_convenio,

} from "../utils/obras-sociales";
import { Command } from "@langchain/langgraph";
import { ToolMessage } from "@langchain/core/messages";
import { workflow } from "../graph";
import { llm } from "../llm/llm";

const obras_sociales_schema = z.object({
  nombre_obra_social: z.string().describe("Nombre de la obra social"),
});

export const obras_sociales_tool = tool(
  async ({ nombre_obra_social }, config) => {
    const state = await workflow.getState({
      configurable: { thread_id: config.configurable.thread_id },
    });
    const tool_call_id =
      state.values.messages[state.values.messages.length - 1].tool_calls[0].id;

    const { info_paciente, messages } = state.values;

    const prompt = `
    Analiza la siguiente conversación y deduce si el ususario consulta sobre una internación o un tratamiento ambulatorio

    conversacion:
    ${messages}
    define una conclusión 
    si es Ambulatorio:
    respuesta:  Actualmente no trabajamos con ${nombre_obra_social} En este caso tendríamos que confeccionar un presupuesto ajustado a sus requerimientos, para presentarlo en su Obra Social. Para ello necesitamos que nos envíe la orden médica con la indicación del tratamiento/ sesiones y cualquier información adicional.  En caso de que no tenga una indicación médica le podemos brindar un turno con equipo médico para que le armen un plan de tratamiento a su medida.

    si es Internacion: Actualmente no trabajamos con ${nombre_obra_social} En este caso tendríamos que confeccionar un presupuesto ajustado a sus requerimientos, para presentarlo en su Obra Social. Para ello necesitamos contar con la Historia Clínica y cualquier información adicional sobre el estado actual del paciente.

`;


    const isConvenio = obras_sociales_con_convenio.find(
      (obra_social) =>
        obra_social.toLocaleLowerCase() ===
        nombre_obra_social.toLocaleLowerCase()
    )
      ? true
      : false

    if (isConvenio) {
      return new Command({
        update: {
          info_paciente: {
            ...info_paciente,
            obra_social: nombre_obra_social,
            tiene_convenio: true,
          },
          messages: [
            new ToolMessage({
              content: `Tenemos convenio con ${nombre_obra_social} avancemos con tu consulta` ,
              tool_call_id,
            }),
          ],
        },
      });
    } else {

        const response = await llm.invoke(prompt);

        console.log("Obras sociales tool");
        console.log(response.content);
        

      return new Command({
        update: {
          info_paciente: {
            ...info_paciente,
            obra_social: nombre_obra_social,
            tiene_convenio: true,
          },
          messages: [
            new ToolMessage({
              content:
                response.content as string,
              tool_call_id,
            }),
          ],
        },
      });
    }
  },
  {
    name: "verificar_obras_sociales",
    description:
      "Verifica si la obra social del paciente tiene convenio con IMAR",
    schema: obras_sociales_schema,
  }
);
