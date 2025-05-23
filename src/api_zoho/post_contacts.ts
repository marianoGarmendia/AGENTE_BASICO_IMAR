import dotenv from "dotenv";
import type { Request, Response } from "express";
import{ getValidAccessToken} from "./tokenManager.js";
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
  req: Request<unknown, unknown, { contact: any }>,
  res: Response
) => {
  const { contact } = req.body; // Asegúrate de que el cuerpo de la solicitud contenga un objeto "lead"

    const token = await getValidAccessToken();


  const bodyInsertContact = {
    data: [
      {
        Full_name: contact.full_name,
        Email: contact.email,
        Tipo_de_tratamiento: contact.tipo_de_tratamiento || "INTERNACION",
        Nombre_y_Apellido_paciente: contact.nombre_paciente || "Sin definir", // Nombre del paciente, solo nombre
        Apellido_paciente: contact.apellido_paciente || "Sin definir", // Apellido del paciente
        Tipo_de_posible_cliente: contact.tipo_de_posible_cliente || "SIN DEFINIR", //"FAMILIAR RESPONSABLE , CONTACTO INSTITUCIONAL , PACIENTE"
        Mobile: contact.telefono || "555-5555", // Teléfono móvil del contacto
        Obra_social: contact.id_obra_social || "4725123000001549012", // ID  de la obra social
        DNI: contact.dni || "123456789", // dni del contacto, puede llegar a ser el mismo paciene o el familiar responsable
        Obra_social1: contact.obra_social || "Sin definir", // Obra social del contacto
        Description:
          contact.descripcion || "Descripción no proporcionada", // Descripción de la consulta del contacto
      },
    ],
  };

  let headers = {
    Authorization: `Zoho-oauthtoken ${token}`,
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
  
      Email: "contactoTestDOS@test.com",
      Last_Name: "Mariano test 23/5", // Nombre de contacto
      Tipo_de_tratamiento: "Internación",
      Mobile: "2214371684",
      Tipo_de_posible_cliente: "Familiar Responsable", // cHEQUEAR SI ES ASI CUANDO ES MULTI-SELECT - "FAMILIAR RESPONSABLE , CONTACTO INSTITUCIONAL , PACIENTE"
      Nombre_y_Apellido_paciente: "jorge", // Es el nombre del paciente
      Apellido_paciente: "Gomez",
      Obra_social: "4725123000001201142",
      Obra_social1: "Petroleros",
      DNI: "256688", // dni del contacto, puede llegar a ser el mismo paciene o el familiar responsable
      Full_Name: "Maria", // nombre completo del contacto, puede llegar a ser el mismo paciene o el familiar responsable
      Description:
        "Este es un contacto de prueba que estamos configruacion desde la api",
      
    },
  ],
};

interface ContactoInsert {
  Email: string;
  Last_Name: string; // nombre de contacto
  Tipo_de_tratamiento: 'Internación' | 'Ambulatorio' | string;
  Mobile: string;
  Tipo_de_posible_cliente: string | string[]; // puede ser multi-select
  Nombre_y_Apellido_paciente: string;
  Apellido_paciente: string;
  Obra_social: string;
  Obra_social1?: string;
  DNI: string;
  Full_Name: string;
  Description?: string;
}

interface BodyInsertContact {
  data: ContactoInsert[];
}


const responseData = {
  data: [
    {
      code: 'SUCCESS',
      duplicate_field: null,
      action: 'insert',
      details: {
        Modified_Time: '2025-05-23T12:28:38-03:00',
        Modified_By: { name: 'Andrea Lischinsky', id: '4725123000000350001' },
        Created_Time: '2025-05-23T12:28:38-03:00',
        id: '4725123000109743001',
        Created_By: { name: 'Andrea Lischinsky', id: '4725123000000350001' }
      },
      message: 'record added',
      status: 'success'
    }
  ]
}




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

  export const loadContact = async ({contact}:{contact:any}) => {

      const token = await getValidAccessToken();

    
  let headers = {
    Authorization: `Zoho-oauthtoken ${token}`,
  };
  console.log("cargando contact en loadContact: ", contact);

   const bodyZohoContact = {
    Full_Name: contact.full_name || "sin definir", // nombre completo del contacto, puede llegar a ser el mismo paciene o el familiar responsable
    
    Last_Name: contact.full_name  || "sin definir",
    Email: contact.email || "sin definir",
    Tipo_de_tratamiento: contact.tipo_de_tratamiento || "INTERNACION",
    Nombre_paciente: contact.nombre_paciente || "Sin definir", // Nombre del paciente, solo nombre
    Apellido_paciente: contact.apellido_paciente || "sin definir", // Apellido del paciente
    Tipo_de_posible_cliente: contact.tipo_de_posible_cliente || "sin definir", //"FAMILIAR RESPONSABLE , CONTACTO INSTITUCIONAL , PACIENTE"
    Mobile: contact.telefono || "555-5555", // Teléfono móvil del contacto
    Obra_social: contact.id_obra_social || "", // id correspondiente - aca poner el id de la obra social "sin definir" para casos donde algo falla en la recopilación del id de la obra social
    Obra_social1: contact.obra_social || "sin definir", // Obra social del contacto
    Description: contact.descripcion || "sin descriptión",
    DNI: contact.dni || "123456789", // dni del contacto, puede llegar a ser el mismo paciene o el familiar responsable
  };


  const bodyInsertContact = {
  data: [
    bodyZohoContact
  ],
};
  
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
    if (data.data[0].status === "success") {
      console.log("Contact procesado correctamente:", data);

      return data.data[0]
     
      // res.status(200).json(data);}
    }
    return null;
  } catch (error) {
    console.error("Error al realizar la solicitud:", error);
    throw new Error("Error al realizar la solicitud" + error); // Re-throw the error for further handling if needed
    // res.status(500).json({ error: "Error al realizar la solicitud" });
   
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
