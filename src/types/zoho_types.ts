interface ZohoLead {
    Full_name: string; // Nombre completo del contacto que está gestionando la conversación,
    Email: string; // Email del contacto que está gestionando la conversación,
    Tipo_de_tratamiento: string,
    Nombre_y_Apellido_paciente: string, // Nombre del paciente, solo nombre
    Apellido_paciente: string, // Apellido del paciente
    Tipo_de_posible_cliente: string, //"FAMILIAR RESPONSABLE , CONTACTO INSTITUCIONAL , PACIENTE"
    Mobile: string,
    Obra_social: string, // id correspondiente
    Description:
      string,
    [key: string]: any; // Permite propiedades adicionales  
}

interface ZohoContact {
  Tipo_de_contacto: string; // Tipo de contacto (Familiar responsable, Paciente, Contacto institucional)
  Tipo_de_tratamiento: string; // Tipo de tratamiento (Internación, Consulta, Emergencia)
  First_Name: string; // Nombre del contacto
  Last_Name: string; // Apellido del contacto
  Email: string; // Email del contacto
  Mobile: string; // Teléfono móvil del contacto
  Nombre_paciente	: string; // Nombre del paciente
  Apellido_paciente: string; // Apellido del paciente
  Obra_social1	: string; // Obra social del contacto
  Obra_social: string; // Obra social del contacto (ID)
  
  DNI	: string; // DNI del contacto
  Description: string; // Descripción de la consulta del contacto
  [key: string]: any; // Permite propiedades adicionales
}


export {
    ZohoLead
    , ZohoContact
}