import { getLeads } from "./api_zoho/get_leads";
import { procesarLead } from "./api_zoho/get_leads";

const callLead = async () => {
  const response = await getLeads();
  if (!response)
    return console.error("No se ha recibido respuesta del servidor");

  const leads = response.data;

  const leadParsed = procesarLead(leads[0]);

  const { nombre, apellido, email, telefono } = leadParsed.contacto;

  // LLamar al agente para que ejecute su funcion y mande mensaje
  // https://mq0smpw9-5000.brs.devtunnels.ms/v1/messages

  const leadToAgent = await fetch(
    "https://mq0smpw9-5000.brs.devtunnels.ms/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AGENT_TOKEN}`,
      },
      body: JSON.stringify({
        number: leadParsed,
        message: `Contactar a este lead para completar la informacón faltante, esta información debes recopilarla de la conversación con la persona, preguntarle si es paciente o familiar responsable, y completar los campos que faltan. la información recopilala de a una por vez, no preguntes todo junto `,
        campos_faltantes: leadParsed.camposFaltantes,
      }),
    }
  );
};

const test_flow = async () => {
  const leadToAgent = await fetch(
    "https://mq0smpw9-5000.brs.devtunnels.ms/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer 1234`,
      },
      body: JSON.stringify({
        nombre: "Mariano",
        apellido: "Garmendia",
        number: "5492214371684",
        message: `Hola Agustin nos nos contactamos desde IMAR para solicitarte algunos datos y avanzar para completar tu consulta `,
        campos_faltantes: [
          "Obra_social",
          "Tipo_de_tratamiento", // Ambulatorio o Internación
          "Email",
        ],
      }),
    }
  );
    console.log(leadToAgent);
    
    
};

await test_flow();
