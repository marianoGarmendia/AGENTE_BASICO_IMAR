import dotenv from "dotenv";
import type { Request, Response } from "express";
import {  ZohoTrato } from "../types/zoho_types.js";
dotenv.config();

const ZOHO_ACCESS_TOKEN = process.env.ZOHO_ACCESS_TOKEN_SANDBOX|| "";
let url = "https://www.zohoapis.com/crm/v2/Deals/upsert";

/**
 * Carga un lead en Zoho CRM.
 * @param contact  -Objeto que contiene los parámetros necesarios para crear un contact
 * @param req - Express Request cuya propiedad `body` es `{ contact: ZohoContact }`
 * @returns
 */

export const post_trato = async (
  req: Request<unknown, unknown, { contact: ZohoTrato }>,
  res: Response
) => {
  const { contact } = req.body; // Asegúrate de que el cuerpo de la solicitud contenga un objeto "lead"

  const bodyInsertTrato = {
    data: [
      {
        Contact_Name: contact.Contact_name, // Nombre de contacto - Probamos con el ID del contacto
        Deal_Name: contact.Deal_name, // Nombre del trato <  string> // Que ponen? ANDREA
        Account_Name: contact.Account_Name , // ID  de la obra social o de la empresa
        Tipo_de_oportunidad: contact.Tipo_de_oportunidad,//["B2C Intenrnación", "B2C Ambulatorios", "B2B"], 
        Nombre_del_Vendedor: contact.Nombre_del_Vendedor, // Nombre del vendedor
      }
    ],
  };

  let headers = {
    Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
  };
  console.log("cargando trato en route trato/create", bodyInsertTrato);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(bodyInsertTrato), // Asegúrate de que el lead esté en un array, ya que la API espera un array de objetos
      
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
      res.status(200).json(data);
      // res.status(200).json(data);}
    }
  } catch (error) {
    console.error("Error al realizar la solicitud:", error);
    // res.status(500).json({ error: "Error al realizar la solicitud" });
    return;
  }
};

// Funcion manual para insertar un Deal

const bodyInsertTrato = {
  data: [
    {
      Contact_Name: "6635034000000698001", // Nombre de contacto - Probamos con el ID del contacto
      Deal_Name: "trato de prueba", // Nombre del trato <  string> // Que ponen? ANDREA
      Account_Name: "6635034000000586116" , // ID  de la obra social o de la empresa
      Tipo_de_oportunidad: "B2C Internación",//["B2C Intenrnación", "B2C Ambulatorios", "B2B"], 
      Nombre_del_Vendedor: "Andrea Lischinsky", // Nombre del vendedor
    }
  ],
};

const load = async () => {
    
  let headers = {
    Authorization: `Zoho-oauthtoken ${ZOHO_ACCESS_TOKEN}`,
  };
  console.log("cargando trato en route trato/create", bodyInsertTrato);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(bodyInsertTrato), // Asegúrate de que el lead esté en un array, ya que la API espera un array de objetos
      
    });
    if (!response.ok) {
      console.error("Error en la respuesta de la API:", response);
      
      return;
    }

    const data = await response.json();
    console.dir(data, { depth: null });
    if (data.status === "success") {
      console.log("Trato procesado correctamente:", data);
     
      // res.status(200).json(data);}
    }
  } catch (error) {
    console.error("Error al realizar la solicitud:", error);
    // res.status(500).json({ error: "Error al realizar la solicitud" });
    return;
  }
};
// load()

const bodyInsertTratoMockup = {
  data: [
    {
      Contact_Name: "6635034000000698001", // Nombre de contacto - Probamos con el ID del contacto
      Deal_Name: "trato de prueba", // Nombre del trato <  string> // Que ponen? ANDREA
      Account_Name: "6635034000000586116" , // ID  de la obra social o de la empresa
      Tipo_de_oportunidad: "B2C INTERNACION",//["B2C Intenrnación", "B2C Ambulatorios", "B2B"], 
      Nombre_del_Vendedor: "Andrea Lischinsky", // Nombre del vendedor
    }
  ],
};

// RESPUESTA DESPUES DE CREAR UN TRATO 

// {
//   data: [
//     {
//       code: 'SUCCESS',
//       duplicate_field: 'Deal_Name',
//       action: 'update',
//       details: {
//         Modified_Time: '2025-05-21T12:56:14-03:00',
//         Modified_By: { name: 'Andrea Lischinsky', id: '6635034000000560010' },
//         Created_Time: '2025-05-21T12:38:46-03:00',
//         id: '6635034000000692008',
//         Created_By: { name: 'Andrea Lischinsky', id: '6635034000000560010' }
//       },
//       message: 'record updated',
//       status: 'success'
//     }
//   ]
// }