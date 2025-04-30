import { messageTemplateGeneric } from "./utils/wsp_templates";


export const responseMessage = async (business_phone_number_id: string, to_phone_number: string, WEBHOOK_VERIFY_TOKEN: string, template: object) => {
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

await responseMessage("643011302226865", "" , "EAARB8DTXEmoBO36ib5VFo152NoHkKcGfsVGogxyVHq7PLFxJD8MLrkMlmx8L7Fuq6PRMzWx39MZBR3qnAr8Qmi20jS2bw6RoaNIgXgAMZAzKM1j4b8p3vblwQM3TOLc47WVvN1Yn5YixVsSsZC1eLZB0j9PFFFwnHBAA6GrdPPtwcAsVuG2BqMnxBh2ZAZAtqsLTlVxEYMMJbXLtZBOU8xTY6A3pKLKarMd6p7u" ,   {
  ...messageTemplateGeneric,
  to: 542215258473,
  text: {
    body: "Asi que te vas a chile a ver al pincha?"
      
  },
})
