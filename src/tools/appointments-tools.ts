import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { obras_sociales } from "../utils/obras-sociales";

type OBRA_SOCIAL = (typeof obras_sociales)[number];

const request_appointment_especialist = tool(
  async ({ especialidad, fecha, horario, consulta, obra_social }) => {},
  {
    name: "request_appointment_especialist",
    description:
      "Solicita una cita con un especialista en la fecha y hora deseadas, ",
    schema: z.object({
      especialidad: z.string().describe("Nombre de la especialidad"),
      fecha: z.coerce.date().describe("Fecha del turno"),
      horario: z.string().describe("Franja horaria del turno"),
      consulta: z.string().describe("Consulta del paciente"),
      obra_social: z
        .string()
        .transform((val) => val.toUpperCase())
        .refine((val: any) => obras_sociales.includes(val), {
          message: "Obra social inválida",
        }),
    }),
  }
);

/*
CONTACTO DEL SITIO WEB 

NOMBRE
APELLIDO
PACIENTE O FAMILIAR > Si es familiar debe poner su nombre y apellido y el de la persona a la que le pide el turno

OBRA SOCIAL - string[] - validaciones - Ver si todas estan activas
EMAIL - <string> - input email - validaciones
MOVIL - <number> - validaciones
TIPO DE CONSULTA > [TTO AMBULATORIO, INTERNACION] <select>
CONSULTA <string>

*/

/*
TODO:
- Ver donde deriva el formulario del sitio web, y si es necesario agregar un nuevo endpoint para recibir los datos del formulario y enviarlos a la API de OpenAI para que genere el mensaje de respuesta.

- Establecer cuales son los campos que determinan que un lead es un trato o no.

- Acceder al canal de facebook , instagram y whatsapp para recibir los mensajes, interactuar y convertirlos en trato o leads para enviar el enpoint del CRM Zoho.

- Rediseñar la web: mejorar y actualizar la informacion, refacotrizar los form de contacto, interfaz predictiva, etc. experiencia de usuario IA.
*/

/*
Hasta ahora el flujo es el siguiente:
1 - El usuario interactua con el bot de la pagina o con el formulario de contacto
- Este lead o trato llega a zoho CRM ( Es trato si tiene la mayor cantidad de datos cargados)

2 - El usuario puede escribir por wsp o llamar y esa información debe cargarse manualmente en el CRM , la idea es cargarla automaticamente. a zoho CRM. como lead o trato dependiendo de la cantidad de datos que tenga el lead.


*/
