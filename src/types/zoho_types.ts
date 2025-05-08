interface ZohoLead {
    Last_Name: string;
    Email: string;
    Tipo_de_tratamiento: string;
    Lead_Status: string;
    Tipo_de_posible_cliente: string; // cHEQUEAR SI ES ASI CUANDO ES MULTI-SELECT
    Phone: string;
    Description: string;
    [key: string]: any; // Permite propiedades adicionales  
}


export {
    ZohoLead
}