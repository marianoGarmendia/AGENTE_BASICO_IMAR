import { z } from "zod";


export const info_paciente_schema = z.object({
  nombre: z.string().describe("Nombre del paciente"),
  apellido: z.string().describe("Apellido del paciente"),
  dni: z.string().describe("DNI del paciente"),
  telefono: z.string().describe("Telefono del paciente"),
  obra_social: z.string().describe("Obra social del paciente"),

  tipo_consulta: z.enum(["TTO AMBULATORIO", "INTERNACION"]).describe(
    "Tipo de consulta del paciente"),
    consulta: z.string().describe("Consulta del paciente, una descripcion breve sobre el motivo de la consulta"),
})






export type InfoPaciente = z.infer<typeof info_paciente_schema>;

