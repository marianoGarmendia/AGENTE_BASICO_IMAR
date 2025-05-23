import Fuse from "fuse.js";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Obtener ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type ObraSocial = {
  id: string;
  nombre: string;
};

interface ObraSocialMap {
  id?: string;
  nombre?: string;
  tipo: "exacta" | "aproximada" | "no encontrada";
}

let idMap = new Map<string, string>();
let fuse: Fuse<ObraSocial>;

export async function cargarObrasSociales() {
  const rutaAlArchivo = join(__dirname, "../docs/obras_sociales_limpio.json");
  const raw = await readFile(rutaAlArchivo, "utf8");
  const data: ObraSocial[] = JSON.parse(raw);

  idMap = new Map(data.map((o) => [o.nombre.toLowerCase(), o.id]));

  fuse = new Fuse(data, {
    keys: ["nombre"],
    includeScore: true,
    threshold: 0.3,
  });

  console.log("✅ Obras sociales cargadas:", data.length);

  if (data.length > 0) {
    return data[0];
  }
}

export function buscarIdObraSocial(nombreObraSocial: string): ObraSocialMap {
  const normalized = nombreObraSocial.trim().toLowerCase();

  // Búsqueda exacta
  const idExacto = idMap.get(normalized);
  if (idExacto) {
    return {
      id: idExacto,
      nombre: nombreObraSocial,
      tipo: "exacta",
    };
  }

  // Búsqueda difusa
  const resultados = fuse.search(nombreObraSocial);
  if (resultados.length > 0) {
    const match = resultados[0].item;
    return {
      id: match.id,
      nombre: match.nombre,
      tipo: "aproximada",
    };
  }

  // Nada encontrado
  return {
    tipo: "no encontrada",
  };
}

// const response = await cargarObrasSociales();

// if (response) {
//   const found = buscarIdObraSocial("la de petroleros");
//   console.log("found", found);
// }
/**
 *
 * Busca el ID de una obra social por su nombre.
 * Para la búsqueda contemplamos dos tipos:
 * - Búsqueda exacta: Busca el ID de la obra social exactamente como se pasa en el parámetro.
 * - Búsqueda difusa: Busca el ID de la obra social utilizando una búsqueda difusa, que permite encontrar coincidencias aproximadas.
 *
 * @param nombreObraSocial - Nombre de la obra social a buscar.
 *
 *
 * @returns Un objeto que contiene el ID de la obra social, el nombre y el tipo de búsqueda realizada.
 *
 *
 */
export const buscarIdObraSocialImar = async (
  nombreObraSocial: string
): Promise<ObraSocialMap> => {
  try {
    const data = await cargarObrasSociales();
    if (data) {
      const obraSocialMapFound = buscarIdObraSocial(nombreObraSocial);
      return obraSocialMapFound;
    } else {
      return {
        tipo: "no encontrada",
      };
    }
  } catch (error) {
    return {
      tipo: "no encontrada",
    };
  }
};
