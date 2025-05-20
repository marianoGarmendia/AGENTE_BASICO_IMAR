import { readFile, writeFile } from 'fs/promises';
import ExcelJS from 'exceljs';

async function procesarXLSX() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('src/docs/os_structured.xlsx');

  const sheet = workbook.worksheets[0];
  const output: { id: string; nombre: string }[] = [];

  sheet.eachRow((row, index) => {
    if (index === 1) return; // saltar encabezado

    const id = row.getCell(1).text.trim();     // columna A
    const nombre = row.getCell(4).text.trim(); // columna D (ajustá si varía)

    if (id && nombre) {
      output.push({ id, nombre });
    }
  });

  await writeFile('src/docs/obras_sociales.json', JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ JSON generado con ${output.length} registros`);
}

// procesarXLSX().catch(console.error);


async function limpiarIds() {
    const raw = await readFile('src/docs/obras_sociales.json', 'utf8');
    const data: { id: string; nombre: string }[] = JSON.parse(raw);
  
    const cleaned = data.map(({ id, nombre }) => ({
      id: id.replace(/^zcrm_/, ''),
      nombre
    }));
  
    await writeFile('src/docs/obras_sociales_limpio.json', JSON.stringify(cleaned, null, 2), 'utf8');
  
    console.log(`✅ JSON generado con IDs limpios (${cleaned.length} registros)`);
  }
  
  limpiarIds().catch(console.error)
