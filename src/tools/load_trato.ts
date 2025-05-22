import {InfoPacienteTrato} from "../types/type_trato";
/** 
*
*
 @param contact - Objeto que contiene los parámetros necesarios para crear un contact
* 
* 
* 
*/

export const load_trato = async ({ contact }: { contact: InfoPacienteTrato }) => {
  console.log("Contacto para trato", contact);



  // Creamos un contacto en la API de Zoho
  // Los campos obligatorios son:
  /*
  Tipo de contacto: Tipo_de_contacto
  Apellidos: Last_name
  Móvil: Mobile // Lo cargamos siempre aunque no sea obligatorio, para tener un contacto, lo tomamos del endpoint del Whatsapp

  */ 

  try {
    const response = await fetch(
      "https://fqfb9bqm-5000.brs.devtunnels.ms/trato/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lead: contact,
        }),
      }
    );
    if (!response.ok) {
      console.error("Error en la respuesta de la API:");
      console.log(response);
      
      return { error: "Error en la respuesta de la API" };
    }

    const data = await response.json();
    console.dir(data, { depth: null });
    if (data.data[0].status === "success") {
      return data.data[0];
    }
    return null;
  } catch (error) {
    throw new Error("ha ocurrido un error" + error); // Re-throw the error for further handling if needed
  }
};
