import { z, ZodTypeAny } from "zod";
import {obras_sociales_tool} from "../tools/obras_sociales";
import {obtener_informacion_paciente} from "../tools/obtener_info_paciente";
import { retrieverToolInfoEstadiaPaciente } from "../tools/instructivos_internacion"; 


interface ToolCall {
  name: string;
  args: Record<string, any>;
  id?: string;
  type?: "tool_call";
}

export function findToolCall<Name extends string>(name: Name) {
  return <Args extends ZodTypeAny>(
    x: ToolCall,
  ): x is { name: Name; args: z.infer<Args>; id?: string } => x.name === name;
}


export const toolsMap = {
  obtener_informacion_paciente: obtener_informacion_paciente,
  verificar_obras_sociales: obras_sociales_tool,
  informacion_general_estadia_paciente: retrieverToolInfoEstadiaPaciente,

}