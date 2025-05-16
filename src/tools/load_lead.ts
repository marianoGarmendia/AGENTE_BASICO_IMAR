import { ZohoLead } from "../types/zoho_types";
/** 
*
*
 @param lead - Objeto que contiene los parámetros necesarios para crear un lead
* 
* 
* 
*/

export const load_lead = async ({ lead }: { lead: any }) => {
  console.log("lead", lead);


  // TODO: Procesar correctamente las imagenes y los archivos para poder subirlos a la api de zoho, en un campo de la persona   
  const bodyZohoLead = {
    Full_name: lead.full_name,
    Email: lead.email,
    Tipo_de_tratamiento: lead.tipo_de_tratamiento,
    Nombre_y_Apellido_paciente: lead.nombre_paciente, // Nombre del paciente, solo nombre
    Apellido_paciente: lead.apellido_paciente, // Apellido del paciente
    Tipo_de_posible_cliente: lead.tipo_de_posible_cliente, //"FAMILIAR RESPONSABLE , CONTACTO INSTITUCIONAL , PACIENTE"
    Mobile: lead.telefono,
    Obra_social: lead.obra_social, // id correspondiente
    Description: lead.descripcion || "",
    dni: lead.dni,
    historia_clinica: lead.historia_clinica,
    foto_carnet: lead.foto_carnet,
    foto_dni: lead.foto_dni,
  };

  try {
    const response = await fetch(
      "https://fqfb9bqm-5000.brs.devtunnels.ms/leads/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lead: bodyZohoLead,
        }),
      }
    );
    if (!response.ok) {
      console.error("Error en la respuesta de la API:");
      return { error: "Error en la respuesta de la API" };
    }

    const data = await response.json();
    console.dir(data, { depth: null });
    if (data.status === "success") {
      return data.status;
    }
    return null;
  } catch (error) {
    throw new Error("ha ocurrido un error" + error); // Re-throw the error for further handling if needed
  }
};
