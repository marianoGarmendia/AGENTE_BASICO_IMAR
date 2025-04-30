import { tool } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { info_paciente_schema, InfoPaciente } from "../types/types_pacients";
import {ToolMessage} from "@langchain/core/messages";
import { workflow } from "../graph";
import {z} from "zod";


const gestion_lead_tool = tool(
    async ({ number_phone , campos_faltantes}) => {
      
    } , {
        name: "gestion_lead_tool",
        description: "Esta herramienta se utiliza para gestionar los leads de pacientes que no completaron su información",
        schema: z.object({
          
            number_phone: z.string().describe("Número de teléfono del paciente"),
            campos_faltantes: z.array(z.string()).describe("Campos faltantes del paciente que debe completar"),
        })
    })