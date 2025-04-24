import { tool } from "@langchain/core/tools";
import { ToolMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { especialidades_dias_profesionales } from "../utils/especialidades";
import { llm } from "../llm/llm";
import { workflow } from "../graph";
import { z } from "zod";

export const getInfoEspcialistSchedule = tool(
  async ({ query, nombre, especialidad }, config) => {
    const state = await workflow.getState({
      configurable: { thread_id: config.configurable.thread_id },
    });
    const tool_call_id =
      state.values.messages[state.values.messages.length - 1].tool_calls[0].id;

    const info_medicos_y_especialdidades = JSON.stringify(
      especialidades_dias_profesionales
    );

    const prompt = `El paciente consulta por los días que atiende el médico ${nombre} de la especialidad ${especialidad}. Responde con un mensaje corto y claro. Si no hay información, responde "No tengo información al momento, diculpame, en que otra cosa podría ayudarte".
    - Contexto de la consulta del paciente: ${query}

    - informacion sobre los médicos y especialidades: ${info_medicos_y_especialdidades}
    `;

    console.log("prompt", prompt);

    const response = await llm.invoke(prompt);

    console.log("response", response);

    // Actualizar el state desde una herramienta
    return new Command({
      // update state keys
      update: {
        info_paciente: {
          consulta: query,
        },
        messages: [
          new ToolMessage({
            content: response.content,
            tool_call_id,
          }),
        ],
      },
    });
  },
  {
    name: "getInfoEspcialistSchedule",
    description:
      "Ésta funcion se utiliza cuando un usuario consulta por los dias que atiende un médico en particular o quiere saber que médicos hay por especialidad y sus dias de atencion",
    schema: z.object({
      query: z.string().describe("Consulta del paciente"),
      nombre: z.string().describe("Nombre del médico por el que consulta"),
      especialidad: z.string().describe("Nombre de la especialidad"),
    }),
  }
);
