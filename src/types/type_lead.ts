export interface leadSchema {
  Full_name: string;
  Email: string;
  Tipo_de_tratamiento: string;
  Lead_Status: string;
  Tipo_de_posible_cliente: string; // cHEQUEAR SI ES ASI CUANDO ES MULTI-SELECT
  Phone: string;
  Last_Name: string;
  Description: string;
  [key: string]: any; // Permite propiedades adicionales},
}
