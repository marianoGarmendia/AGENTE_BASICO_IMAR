import { z } from "zod";
import { retrieverInfoEstadiaPaciente } from "../utils/loaders";

export const retrieverToolInfoEstadiaPaciente = retrieverInfoEstadiaPaciente.asTool({
  name: "retriever_infogeneral_estadia_paciente",
  description:
    "Ésta funcion se utiliza para responder preguntas sobre el documento de información general para la estadía del paciente en IMAR",
  schema: z.string().describe("Consulta del paciente"),
});




