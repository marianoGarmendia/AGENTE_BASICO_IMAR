import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { obras_sociales_con_convenio } from "../utils/obras-sociales";
import { formatMessages } from "../utils/format-messages";
import { Command } from "@langchain/langgraph";
import { ToolMessage } from "@langchain/core/messages";
import { workflow } from "../graph";
import { llm } from "../llm/llm";

const obras_sociales_schema = z.object({
  nombre_obra_social: z.string().describe("Nombre de la obra social"),
});

/**
 * Verifica si la obra social del paciente tiene convenio con IMAR
 * @param nombre_obra_social  -string - Nombre de la obra social  
 *
 * @returns {Promise<ToolMessage>} - Devuelve un mensaje indicando si la obra social tiene convenio o no
 */

export const obras_sociales_tool = tool(
  async ({ nombre_obra_social }, config) => {
    const state = await workflow.getState({
      configurable: { thread_id: config.configurable.thread_id },
    });
    const tool_call_id =
      state.values.messages[state.values.messages.length - 1].tool_calls[0].id;

    const isConvenio = obras_sociales_con_convenio.find(
      (obra_social) =>
        obra_social.toLocaleLowerCase() ===
        nombre_obra_social.toLocaleLowerCase()
    )
      ? true
      : false;

    const message = `La obra social ${nombre_obra_social} ${
      isConvenio ? "tiene" : "al momento no tiene"
    } convenio con nuestra institución. ${!isConvenio ? "igualmente hay procesos que podemos seguir para evaluar alternativas, si me brindas los datos necesarios podemos iniciar la gestión. ¿estás de acuerdo?" : "Vamos a precisar que nos envíes una foto del carnet de la obra social, podes hacerlo ahora o después"} `;

    return new ToolMessage(message, tool_call_id, "verificar_obras_sociales");
  },
  {
    name: "verificar_obras_sociales",
    description:
      "Verifica si la obra social del paciente tiene convenio con IMAR",
    schema: obras_sociales_schema,
  }
);
