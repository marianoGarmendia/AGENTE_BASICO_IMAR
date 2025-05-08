import dotenv from "dotenv";
import type { Request, Response } from "express";
import { type ZohoLead } from "../types/zoho_types.js";
dotenv.config();

const ZOHO_ACCESS_TOKEN = process.env.ZOHO_ACCESS_TOKEN || "";
let url = "https://www.zohoapis.com/crm/v2/Leads/upsert";

/**
 * Carga un lead en Zoho CRM.
 * @param lead  -Objeto que contiene los parámetros necesarios para crear un lead
 * @param req - Express Request cuya propiedad `body` es `{ lead: ZohoLead }`
 * @returns
 */

export const post_lead = async (
  req: Request<unknown, unknown, { lead: ZohoLead }>,
  res: Response
) => {
  const { lead } = req.body; // Asegúrate de que el cuerpo de la solicitud contenga un objeto "lead"

  const bodyInsertLead = {
    data: [
      {
        Full_name: lead.Full_name,
        Email: lead.Email,
        Tipo_de_tratamiento: lead.Tipo_de_tratamiento,
        Lead_Status: "No contactado",
        Tipo_de_posible_cliente: lead.Tipo_de_posible_cliente, // cHEQUEAR SI ES ASI CUANDO ES MULTI-SELECT
        Phone: lead.Phone,
        Last_Name: lead.Last_Name,
        Description:
          lead.Description || "",
      },
    ],
  };

  let headers = {
    Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
  };
  console.log("cargando lead en route lead/create", bodyInsertLead);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(bodyInsertLead), // Asegúrate de que el lead esté en un array, ya que la API espera un array de objetos
      
    });
    if (!response.ok) {
      console.error("Error en la respuesta de la API:", response.statusText);
      res.status(500).json({ error: "Error en la respuesta de la API" });
      return;
    }

    const data = await response.json();
    console.dir(data, { depth: null });
    if (data.status === "success") {
      console.log("Lead procesado correctamente:", data);
      // res.status(200).json(data);}
    }
  } catch (error) {
    console.error("Error al realizar la solicitud:", error);
    // res.status(500).json({ error: "Error al realizar la solicitud" });
    return;
  }
};

// body para insertar un lead

const bodyInsertLead = {
  data: [
    {
      Last_Name: "Mariano osde",
      Email: "otroLead@lead.com",
      Tipo_de_tratamiento: "Tto ambulatorio",
      Lead_Status: "No contactado",
      Tipo_de_posible_cliente: "Familiar Responsable", // cHEQUEAR SI ES ASI CUANDO ES MULTI-SELECT
      Phone: "2214371684",
      Description:
        "Este es un lead de prueba que estamos configruacion desde la api",
    },
  ],
};

// (async () => {
//   await post_lead();
//   // Aquí puedes manejar la respuesta de la API o cualquier otra lógica que necesites
//   console.log("Lead procesado correctamente.");
//   // Respuesta cuando se procesa incorrectamente:

//     {
//   data: [
//     {
//       code: 'INVALID_DATA',
//       details: {
//         expected_data_type: 'text',
//         api_name: 'Tipo_de_posible_cliente'
//       },
//       message: 'invalid data',
//       status: 'error'
//     }
//   ]
// }

// RESPUESAT CAUDNO SE PROCESA EXITOSAMENTE

// {
//   data: [
//     {
//       code: 'SUCCESS',
//       duplicate_field: null,
//       action: 'insert',
//       details: {
//         Modified_Time: '2025-05-05T13:23:09-03:00',
//         Modified_By: { name: 'Andrea Lischinsky', id: '6635034000000560010' },
//         Created_Time: '2025-05-05T13:23:09-03:00',
//         id: '6635034000000607001',
//         Created_By: { name: 'Andrea Lischinsky', id: '6635034000000560010' }
//       },
//       message: 'record added',
//       status: 'success'
//     }
//   ]
// }
// })();
