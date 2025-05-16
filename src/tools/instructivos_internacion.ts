import { z } from "zod";
import { retrieverInfoEstadiaPaciente  } from "../utils/loaders";

export const retrieverToolInfoEstadiaPaciente = retrieverInfoEstadiaPaciente.asTool({
  name: "informacion_general_estadia_paciente",
  description:
    "Ésta funcion se utiliza para responder preguntas sobre el documento de información general para la estadía del paciente en IMAR",
  schema: z.string().describe("Consulta del usuario sobre la estadia del paciente"),
  
});

// export const retrieverToolNormasDeInternacion = retrieverNormasInternación.asTool({
//   name: "informacion_normas_internacion_2019",
//   description:
//     "Ésta funcion se utiliza para responder preguntas sobre el documento de normas de internación en IMAR",
//   schema: z.string().describe("Consulta del paciente"),
// })




