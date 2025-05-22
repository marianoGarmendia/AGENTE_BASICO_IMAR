import dotenv from "dotenv";
import type { Request, Response } from "express";
import {  type ZohoContact } from "../types/zoho_types.js";
import { type ReponseContact} from "../types/type_contact.js";
dotenv.config();

const ZOHO_ACCESS_TOKEN = process.env.ZOHO_ACCESS_TOKEN_SANDBOX || "";
let url = "https://www.zohoapis.com/crm/v2/Contacts/upsert";

/**
 * Carga un lead en Zoho CRM.
 * @param Contact  -Objeto que contiene los parámetros necesarios para crear un lead
 * @param req - Express Request cuya propiedad `body` es `{ lead: ZohoLead }`
 * @returns
 */

export const post_contact = async (
  req: Request<unknown, unknown, { contact: ZohoContact }>,
  res: Response
) => {
  const { contact } = req.body; // Asegúrate de que el cuerpo de la solicitud contenga un objeto "lead"

  const bodyInsertContact = {
    data: [
      {
        Full_name: contact.Full_name,
        Email: contact.Email,
        Tipo_de_tratamiento: contact.Tipo_de_tratamiento,
        Nombre_y_Apellido_paciente: contact.Nombre_y_Apellido_paciente, // Nombre del paciente, solo nombre
        Apellido_paciente: contact.Apellido_paciente, // Apellido del paciente
        Tipo_de_posible_cliente: contact.Tipo_de_posible_cliente, //"FAMILIAR RESPONSABLE , CONTACTO INSTITUCIONAL , PACIENTE"
        Mobile: contact.Mobile,
        Obra_social: contact.Obra_social || "4725123000001549012", // ID  de la obra social
        DNI: contact.DNI,
        Obra_social1: contact.Obra_social1,
        Description:
          contact.Description || "",
      },
    ],
  };

  let headers = {
    Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
  };
  console.log("cargando contacto en route contact/create", bodyInsertContact);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(bodyInsertContact), // Asegúrate de que el lead esté en un array, ya que la API espera un array de objetos
      
    });
    if (!response.ok) {
      console.error("Error en la respuesta de la API:", response.statusText);
      res.status(500).json({ error: "Error en la respuesta de la API" });
      return;
    }

    const data = await response.json();
    console.dir(data, { depth: null });
    if (data.status === "success") {
      console.log("Contacto procesado correctamente:", data);

      res.status(200).json(data);
      // res.status(200).json(data);}
    }
  } catch (error) {
    console.error("Error al realizar la solicitud:", error);
    // res.status(500).json({ error: "Error al realizar la solicitud" });
    return;
  }
};

// body para insertar un lead

const bodyInsertContact = {
  data: [
    {
   
      Email: "contactoTest@test.com",
      Last_Name: "Mariano test", // Nombre de contacto
      Tipo_de_tratamiento: "Internación",
      Mobile: "2214371684",
      Tipo_de_posible_cliente: "Familiar Responsable", // cHEQUEAR SI ES ASI CUANDO ES MULTI-SELECT - "FAMILIAR RESPONSABLE , CONTACTO INSTITUCIONAL , PACIENTE"
      Nombre_y_Apellido_paciente: "jorge", // Es el nombre del paciente
      Apellido_paciente: "Gomez",
      Obra_social: "6635034000000586107",
      Obra_social1: "Petroleros",
      DNI: "256688", // dni del contacto, puede llegar a ser el mismo paciene o el familiar responsable
      Full_Name: "Maria", // nombre completo del contacto, puede llegar a ser el mismo paciene o el familiar responsable
      Description:
        "Este es un contacto de prueba que estamos configruacion desde la api",
      
    },
  ],
};



// En respuesta a esta carga:

// {
//     data: [
//       {
//         code: 'SUCCESS',
//         duplicate_field: null,
//         action: 'insert',
//         details: {
//           Modified_Time: '2025-05-21T13:03:08-03:00',
//           Modified_By: { name: 'Andrea Lischinsky', id: '6635034000000560010' },
//           Created_Time: '2025-05-21T13:03:08-03:00',
//           id: '6635034000000707001', // ID del contacto creado con este id debo crear el trato *********
//           Created_By: { name: 'Andrea Lischinsky', id: '6635034000000560010' }
//         },
//         message: 'record added',
//         status: 'success'
//       }
//     ]
//   }

  const load = async () => {
    
  let headers = {
    Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
  };
  console.log("cargando contact en route contact/create", bodyInsertContact);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(bodyInsertContact), // Asegúrate de que el lead esté en un array, ya que la API espera un array de objetos
      
    });
    if (!response.ok) {
      console.error("Error en la respuesta de la API:", response);
      
      return;
    }

    const data = await response.json();
    console.dir(data, { depth: null });
    if (data.status === "success") {
      console.log("Contact procesado correctamente:", data);
     
      // res.status(200).json(data);}
    }
  } catch (error) {
    console.error("Error al realizar la solicitud:", error);
    // res.status(500).json({ error: "Error al realizar la solicitud" });
    return;
  }
};
// load();
  // Aquí puedes manejar la respuesta de la API o cualquier otra lógica que necesites
  
  // Respuesta cuando se procesa incorrectamente:

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
// Respuesta cuando se procesa correctamente
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
