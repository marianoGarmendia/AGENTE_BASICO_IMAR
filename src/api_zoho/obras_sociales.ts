import { fileURLToPath } from "url";
import fs, { readFileSync } from "fs";
import { dirname } from "path";
import { join } from "path";

// Obtiene el path del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta absoluta al archivo
const filePath = join(__dirname, "Accounts.json");

// Leer y parsear el contenido
const rawData = readFileSync(filePath, "utf-8");
const jsonArray = JSON.parse(rawData);

const jsonParser = jsonArray.map((item: any) => {
  return {
    Account_Name: item.Account_Name,
    id: item.id,
    // Agrega aquí más propiedades que necesites
  };
});

const jsonContent = JSON.stringify(jsonParser, null, 2);

// ✅ jsonArray ahora es un array de objetos JS
console.log(jsonArray);
console.log(jsonArray[0].Account_Name); // "Ospe"
console.log(jsonArray[0].id); // "Ospe"

// Ruta absoluta al archivo
const filePathWrite = join(__dirname, "obras_sociales.json");

fs.writeFile(filePathWrite, jsonContent, "utf8", (err) => {
  if (err) {
    console.error("Error al guardar los obras_sociales en el archivo:", err);
  } else {
    console.log("account guardados exitosamente en obras_sociales.json");
  }
});
