/**
 * Parsea un número de teléfono argentino y, si contiene un '9' después del código de país '54',
 * lo elimina para normalizar el número.
 *
 * @param {number | string} phoneNumber - El número de teléfono a procesar. Puede ser un número o una cadena de texto.
 * @returns {string} - El número de teléfono normalizado sin el '9' después del '54', si estaba presente.
 */


export function parsePhoneNumber(phoneNumber: number | string): string {
  let phoneStr = phoneNumber.toString().trim();

  // Si el número comienza con "+", quitarlo
  if (phoneStr.startsWith("+")) {
    phoneStr = phoneStr.slice(1);
  }

  // Extraer el código de país (puede ser de 2 o 3 dígitos)
  const countryCode = phoneStr.slice(0, 2);

  // Argentina: Eliminar el "9" después del "54"
  if (countryCode === "54" && phoneStr.charAt(2) === "9") {
    return "54" + phoneStr.slice(3);
  }

  // México: Antes de 2020 se usaba un "1" después del código de país en móviles, ahora NO debe estar
  if (countryCode === "52" && phoneStr.charAt(2) === "1") {
    return "52" + phoneStr.slice(3);
  }

  // Otros países: Dejar el número como está
  return phoneStr;
}