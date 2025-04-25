import { tool } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { info_paciente_schema, InfoPaciente } from "../types/types_pacients";
import {ToolMessage} from "@langchain/core/messages";
import { workflow } from "../graph";

export const get_info_by_trato = tool(
  async (
    {
      consulta,
      dni,
      obra_social,
      telefono,
      tipo_consulta,
      nombre,
      apellido,
    }: InfoPaciente,
    config
  ) => {
    const state = await workflow.getState({
      configurable: { thread_id: config.configurable.thread_id },
    });

    const { messages} = state.values;
    const tool_call_id = messages.at(-1)?.tool_calls.at(-1)?.id

    const result = info_paciente_schema.safeParse({consulta,
        dni,
        obra_social,
        telefono,
        tipo_consulta,
        nombre,
        apellido})

        if(!result.success){
            return "algunos datos no son correctos o faltan, vamos a interntarlo de nuevo"
        }
        const message = `El paciente ${result.data.nombre} ${result.data.apellido} consulta por ${result.data.consulta}, su dni es ${result.data.dni}, su obra social es ${result.data.obra_social}, su telefono es ${result.data.telefono}, el tipo de consulta es ${result.data.tipo_consulta}`
        return new Command({
            update: {
              info_paciente: result.data,
              messages: [new ToolMessage(message, tool_call_id, "get_info_by_trato.name")],
            },
          });
  },
  {
    name: "get_info_by_trato",
    description:
      "Ésta funcion se utiliza cuando un usuario consulta por los días que atiende un médico en particular o quiere saber que médicos hay por especialidad y sus dias de atencion",
    schema: info_paciente_schema,
  }
);
