import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import fs from "fs";
dotenv.config();

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ACCESS_TOKEN = process.env.ZOHO_ACCESS_TOKEN || "";

export async function getContactos():Promise<any> {
    try {
        const response = await  fetch('https://www.zohoapis.com/crm/v2/Contacts',{
         method: 'GET',
         headers: {
           Authorization: `Zoho-oauthtoken ${ACCESS_TOKEN}`,
           'Content-Type': 'application/json',
        }})
     
         const data = await response.json();
          console.log("data", data);
          
         if (data && data.data) {
            const contacts = data.data;
            // Calcula __filename y __dirname a partir de import.meta.url

      
            // Definir la ruta del archivo donde se guardarán los contactos
            const filePath = path.join(__dirname, 'contacts.json');
      
            // Convertir los contactos a formato JSON con indentación para mejor legibilidad
            const jsonContent = JSON.stringify(contacts, null, 2);
      
            // Escribir los contactos en el archivo JSON
            fs.writeFile(filePath, jsonContent, 'utf8', (err) => {
              if (err) {
                console.error('Error al guardar los contacts en el archivo:', err);
              } else {
                console.log('Contactos guardados exitosamente en contacts.json');
              }
            });

            return data
          } else {
            console.error('La respuesta de la API no contiene datos de contactos.');
          }
        
    } catch (error) {
        console.error('Error fetching leads:', error);
        throw new Error("ha ocurrido un error" + error); // Re-throw the error for further handling if needed
    }
    

}

// Devuelve un objeto con la prop data que es un array de leads objetos
await  getContactos()



//----------------------------------------------

