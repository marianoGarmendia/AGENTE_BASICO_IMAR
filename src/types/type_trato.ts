import {InfoPaciente} from "../types/types_pacients";

type TipoDeOportunidad = 'B2C Internación' | 'B2C Ambulatorios' | 'B2B';
type NombreDelVendedor = 'Andrea Lischinsky' | (string & {});


export type InfoPacienteTrato = {
    Contact_name: string | null; // ID del contacto 
    Deal_name: string | null; // Nombre del trato
    Account_Name: string | null, // ID  de la obra social o de la empresa
    Tipo_de_oportunidad: TipoDeOportunidad , // ["B2C Internación", "B2C Ambulatorios", "B2B"], 
    Nombre_del_Vendedor: NombreDelVendedor, // "Andrea Andrea Lischinsky"
  };