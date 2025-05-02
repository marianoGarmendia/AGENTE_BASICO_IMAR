import { messageTemplateGeneric } from "./utils/wsp_templates";
import { SendMessageParams } from "./types/types_wsp_params";

/**
 * Envia un mensaje a través de la API de WhatsApp Business.
 * @param SendMessageParams - Objeto que contiene los parámetros necesarios para enviar el mensaje.
 * @param SendMessageParams.business_phone_number_id - ID del número de teléfono de WhatsApp Business que envía el mensaje
 * @param SendMessageParams.WEBHOOK_VERIFY_TOKEN - Token de verificación del webhook de WhatsApp Business
 * @param SendMessageParams.template - Plantilla del mensaje a enviar, que incluye el número de teléfono del destinatario y el cuerpo del mensaje
 * @returns
 */

export const sendMessageWsp = async ({
  business_phone_number_id,
  WEBHOOK_VERIFY_TOKEN,
  template,
}: SendMessageParams) => {
  // Send a reply message
  let result = null;
  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${business_phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WEBHOOK_VERIFY_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(template),
      }
    );

    result = await response.json();

    console.log("Message sent successfully:", result);
  } catch (error) {
    console.error("Error sending message:", error);
  }

  return result;
};

// Ejemplo de la respuesta de la API de whatsapp cuando un mensaje es enviado correctamente guardado en "result"
// Respuesta de la api de whatsapp cuando un mensaje es enviado correctamente
// const responseMessage = {
//   messaging_product: "whatsapp",
//   contacts: [{ input: "+542214371684", wa_id: "5492214371684" }],
//   messages: [
//     {
//       id: "wamid.HBgNNTQ5MjIxNDM3MTY4NBUCABEYEjkwOUE1Q0NCRDRGMkE1QThEMwA=", // el id del mensaje dentro de wsp
//     },
//   ],
// };

await sendMessageWsp({
  business_phone_number_id: "643011302226865",
  WEBHOOK_VERIFY_TOKEN:
    "EAARB8DTXEmoBO36ib5VFo152NoHkKcGfsVGogxyVHq7PLFxJD8MLrkMlmx8L7Fuq6PRMzWx39MZBR3qnAr8Qmi20jS2bw6RoaNIgXgAMZAzKM1j4b8p3vblwQM3TOLc47WVvN1Yn5YixVsSsZC1eLZB0j9PFFFwnHBAA6GrdPPtwcAsVuG2BqMnxBh2ZAZAtqsLTlVxEYMMJbXLtZBOU8xTY6A3pKLKarMd6p7u",
  template: {
    ...messageTemplateGeneric,
    to: 542215258473,
    text: {
      body: "Asi que te vas a chile a ver al pincha?",
    },
  },
});
