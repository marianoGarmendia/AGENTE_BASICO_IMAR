import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Fuse from "fuse.js";
import { obras_sociales_con_convenio } from "../utils/obras-sociales";
import { ToolMessage } from "@langchain/core/messages";
import { workflow } from "../graph";

export const obrasConConvenioSet = new Set(
  obras_sociales_con_convenio.map((n) => n.toLowerCase())
);

export function tieneConvenio(nombre: string): boolean {
  return obrasConConvenioSet.has(nombre.trim().toLowerCase());
}

// Utilizamos la clase Fuse para realizar la búsqueda difusa
const fuse = new Fuse(obras_sociales_con_convenio, {
  includeScore: true, // DeVUELVE ITEM Y SCORE
  threshold: 0.3, // tolerancia que tan lejos o cerca permite la busqueda, 0 es exacto, 1 es malisimo
});

export function buscarObraSocial(nombre: string) {
  const resultado = fuse.search(nombre);
  return resultado.length > 0 ? resultado[0].item : null;
}


const obras_sociales_schema = z.object({
  nombre_obra_social: z.string().describe("Nombre de la obra social"),
});


/**
 * Verifica si la obra social del paciente tiene convenio con IMAR
 * @param nombre_obra_social  -string - Nombre de la obra social
 *
 * @returns {Promise<ToolMessage>} - Devuelve un mensaje indicando si la obra social tiene convenio o no
 */

export const  obras_sociales_tool = tool(
  async ({ nombre_obra_social }, config) => {

    const state = await workflow.getState({
      configurable: { thread_id: config.configurable.thread_id },
    });

    const tool_call_id =
      state.values.messages[state.values.messages.length - 1].tool_calls[0].id;

    const normalizado = nombre_obra_social.trim().toLowerCase();

    if (tieneConvenio(normalizado)) {
      return new ToolMessage(
        `La obra social ${nombre_obra_social} tiene convenio con nuestra institución. Vamos a precisar que nos envíes una foto del carnet de la obra social, podes hacerlo ahora o después`,
        tool_call_id,
        "verificar_obras_sociales"
      );
    }

    // Si no hay coincidencia exacta, buscamos con Fuse
    const resultados = fuse.search(normalizado);

    

    if (resultados.length > 0 && resultados[0].score! <= 0.3) {
      const mejorCoincidencia = resultados[0].item;
      const mensaje = `Quizás te referías a ${mejorCoincidencia}, ¿es correcto?, de ser asi procedemos a verificar si tiene convenio con nuestra institución.`;
      return new ToolMessage(mensaje, tool_call_id, "verificar_obras_sociales");
    }

    return new ToolMessage(
      `No tenemos convenio con ${nombre_obra_social} igualmente podemos proceder continuar con el proceso, despues nos contactaremos para evaluar alternativas.`,
      tool_call_id,
      "verificar_obras_sociales"
    );
  },
  {
    name: "verificar_obras_sociales",
    description:
      "Verifica si la obra social del paciente tiene convenio con IMAR",
    schema: obras_sociales_schema,
  }
);
