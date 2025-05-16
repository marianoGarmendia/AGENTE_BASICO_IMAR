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


export {
    ZohoLead
}