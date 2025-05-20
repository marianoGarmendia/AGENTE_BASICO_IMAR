import { z } from "zod";

export const info_paciente_schema = z.object({
  nombre_paciente: z.string().describe("Nombre del paciente"),
  apellido_paciente: z.string().describe("Apellido del paciente"),
  tipo_de_posible_cliente: z.enum(["Familiar responsable", "Contacto institucional", "Paciente"]).describe("Tipo de posible cliente puede ser [Paciente, Familiar responsable, Contacto institucional]"),
  full_name: z
    .string()
    .describe(
      "Nombre completo del familiar que esta haciendo la consulta, si es que es un familiar el que hace la consulta"
    )
    ,
  email: z
    .string()
    .email()
    .describe(
      "Email del familiar que esta haciendo la consulta, si el que hace la consulta es el propio paciente que brinde su email"
    )
    ,
  dni: z
    .string()
    .describe("DNI del paciente, consta de al menos 8 dígitos")
    .nullable(),
 
  obra_social: z.string().describe("Obra social del paciente").nullable(),
  
  historia_clinica: z
    .string()
    .describe(
      "Historia clinica del paciente, debe subir un archivo con la historia clinica"
    )
    .nullable(),
  foto_carnet: z
    .string()
    .describe(
      "Foto del carnet de la obra social del paciente, debe subir un archivo con la foto del carnet"
    )
    .nullable(),
  foto_dni: z
    .string()
    .describe(
      "Foto del dni del paciente, debe subir un archivo con la foto del dni"
    )
    .nullable(),

  
  descripcion: z
    .string() 
    .describe(
      "consulta del paciente que obtenes de la conversación, un resumen que le facilite al personal administrativo de IMAR la carga de la internación, cuando se contacte con el paciente"
    ),
});

export type InfoPaciente = z.infer<typeof info_paciente_schema>;
