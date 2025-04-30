import dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config();

const ACCESS_TOKEN = process.env.ZOHO_ACCESS_TOKEN || "";

export async function getLeads():Promise<any> {
    try {
        const response = await  fetch('https://www.zohoapis.com/crm/v2/Leads',{
         method: 'GET',
         headers: {
           Authorization: `Zoho-oauthtoken ${ACCESS_TOKEN}`,
           'Content-Type': 'application/json',
        }})
     
         const data = await response.json();
         
         if (data && data.data) {
            const leads = data.data;
      
            // Definir la ruta del archivo donde se guardarán los leads
            const filePath = path.join(__dirname, 'leads.json');
      
            // Convertir los leads a formato JSON con indentación para mejor legibilidad
            const jsonContent = JSON.stringify(leads, null, 2);
      
            // Escribir los leads en el archivo JSON
            fs.writeFile(filePath, jsonContent, 'utf8', (err) => {
              if (err) {
                console.error('Error al guardar los leads en el archivo:', err);
              } else {
                console.log('Leads guardados exitosamente en leads.json');
              }
            });

            return data
          } else {
            console.error('La respuesta de la API no contiene datos de leads.');
          }
        
    } catch (error) {
        console.error('Error fetching leads:', error);
        throw new Error("ha ocurrido un error" + error); // Re-throw the error for further handling if needed
    }
    

}

// Devuelve un objeto con la prop data que es un array de leads objetos
// await  getLeads()



//----------------------------------------------

export function procesarLead(lead: Record<string, any>) {

    // Tipo de posible cliente puede ser ["Paciente", "Familiar responsable","Contacto institucional"]
    // Campos que deben completarse si están en null
    const camposACompletar = [
      "Nombre_y_Apellido_paciente", 
      "Obra_social",
      "Tipo_de_tratamiento", // Ambulatorio o Internación
      "Tipo_de_posible_cliente",
      "Cargo",
      "Email",
      "City",
      "Lead_Status", //Estado de posible contacto: No contactado
      "State",
      "Description",
      "Street",
      "Phone",
      "Number_Of_Chats",
      "Apellido_paciente",
      "ltimo_contacto",
    ];
  
    const camposFaltantes = camposACompletar.filter(
      (campo) => lead[campo] === null || lead[campo] === ""
    );
  
    // Datos de contacto principales
    const contacto = {
      nombre: lead.First_Name || "",
      apellido: lead.Last_Name || "",
      telefono: lead.Mobile || lead.Phone || "",
      email: lead.Email || "",
    };
  
    return { camposFaltantes, contacto };
  }
  
