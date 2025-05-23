import dotenv from "dotenv";
import path from "path";
import {getValidAccessToken} from "./tokenManager";
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import fs from "fs";
dotenv.config();

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)



export async function getTrato():Promise<any> {
    const token = await getValidAccessToken();

    try {
        const response = await  fetch('https://www.zohoapis.com/crm/v2/Deals',{
         method: 'GET',
         headers: {
           Authorization: `Zoho-oauthtoken ${token}`,
           'Content-Type': 'application/json',
        }})
     
         const data = await response.json();
         
         if (data && data.data) {
            const Deals = data.data;
            // Calcula __filename y __dirname a partir de import.meta.url

      
            // Definir la ruta del archivo donde se guardarán los leads
            const filePath = path.join(__dirname, 'Deals.json');
      
            // Convertir los leads a formato JSON con indentación para mejor legibilidad
            const jsonContent = JSON.stringify(Deals, null, 2);
      
            // Escribir los leads en el archivo JSON
            fs.writeFile(filePath, jsonContent, 'utf8', (err) => {
              if (err) {
                console.error('Error al guardar los Tratos en el archivo:', err);
              } else {
                console.log('Deals guardados exitosamente en Deals.json');
              }
            });

            return data
          } else {
            console.error('La respuesta de la API no contiene datos de Deals.');
          }
        
    } catch (error) {
        console.error('Error fetching leads:', error);
        throw new Error("ha ocurrido un error" + error); // Re-throw the error for further handling if needed
    }
    

}

// Devuelve un objeto con la prop data que es un array de Tratos (Deals) objetos
await  getTrato()



//----------------------------------------------

