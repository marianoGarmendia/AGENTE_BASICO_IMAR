import {type ReponseContact} from "../types/type_contact";
/** 
*
*
 @param contact - Objeto que contiene los parámetros necesarios para crear un contact
* 
* 
* 
*/

export const load_contact = async ({ contact }: { contact: any }) => {
  console.log("contact", contact);

  const contactMockup =  {
    descripcion: 'Gestionar la internación de mi tío, Juan Gómez, con obra social OSPE.',
    telefono: undefined,
    tipo_de_tratamiento: 'INTERNACION',
    tipo_de_posible_cliente: 'Familiar responsable',
    dni: null,
    foto_carnet: 'foto crnet',
    foto_dni: 'foto dni',
    obra_social: 'OSPE',
    historia_clinica: null,
    email: 'contacto@test.com',
    full_name: 'Mariano Garmendia',
    nombre_paciente: 'Juan',
    apellido_paciente: 'Gómez'
  }


  // TODO: Procesar correctamente las imagenes y los archivos para poder subirlos a la api de zoho, en un campo de la persona   
  const bodyZohoContact = {
    Full_name: contact.full_name || "sin nombre",
    Last_name: contact.full_name  || "sin nombre",
    Email: contact.email || "sin email",
    Tipo_de_tratamiento: contact.tipo_de_tratamiento || "INTERNACION",
    Nombre_y_Apellido_paciente: contact.nombre_paciente, // Nombre del paciente, solo nombre
    Apellido_paciente: contact.apellido_paciente, // Apellido del paciente
    Tipo_de_posible_cliente: contact.tipo_de_posible_cliente, //"FAMILIAR RESPONSABLE , CONTACTO INSTITUCIONAL , PACIENTE"
    Mobile: contact.telefono,
    Obra_social: contact.obra_social, // id correspondiente
    Obra_social1: contact.id_obra_social,
    Description: contact.descripcion || "",
    DNI: contact.dni || null,
  };


  // Creamos un contacto en la API de Zoho
  // Los campos obligatorios son:
  /*
  Tipo de contacto: Tipo_de_contacto
  Apellidos: Last_name
  Móvil: Mobile // Lo cargamos siempre aunque no sea obligatorio, para tener un contacto, lo tomamos del endpoint del Whatsapp

  */ 

  try {
    const response = await fetch(
      "https://fqfb9bqm-5000.brs.devtunnels.ms/contacts/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact: bodyZohoContact,
        }),
      }
    );
    if (!response.ok) {
      console.error("Error en la respuesta de la API:");
      console.log(response);
      
      return { error: "Error en la respuesta de la API" };
    }

    const data:ReponseContact = await response.json();
    console.dir(data, { depth: null });
    if (data.data[0].status === "success") {
      return data.data[0];
    }
    return null;
  } catch (error) {
    throw new Error("ha ocurrido un error" + error); // Re-throw the error for further handling if needed
  }
};
