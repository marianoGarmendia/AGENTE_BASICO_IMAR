// const ENVIAR_WHATSAPP = tool(
//     async ({ number_cel, consulta_cliente, nombre_cliente }) => {
//       // const regex = /^54\d{10}$/;
//       // const is_valid_number = regex.test(number_cel);
//       if (number_cel.length < 10) {
//         return "Por favor ingresá un número de teléfono válido de 10 dígitos. por ejemplo 2214xx xxxx"
//       }
//       console.log("enviando mensaje por whatsapp");
      
//       const business_phone_number_id = "561091527089092";
//       const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN as string;
  
//       const templateFunny = {
//         messaging_product: "whatsapp",
//         to: "5491135620347",
//         type: "template",
//         template: {
//           name: "consulta_cliente_v2",
//           language: { "code": "en" },
//           "components": [
//             {
//               "type": "body",
//               "parameters": [
//                 { type: "text",  parameter_name: "nombre_cliente",  text: `${nombre_cliente}` },
//                 { type: "text",  parameter_name: "fecha_consulta",  text: `${new Date().toLocaleString()}` },
//                 { type: "text",  parameter_name: "consulta_cliente",  text: `${consulta_cliente}` },
//                 { type: "text",  parameter_name: "num_telefono",  text: `${number_cel}` },
                
//               ]
//             }
//           ]
//         }
//       }
  
//       const response = await responseMessage(
//         business_phone_number_id,
//         WEBHOOK_VERIFY_TOKEN,
//         templateFunny,
//       );
//       if (!response) {
//         return "Hubo un problema al enviar el mensaje por WhatsApp. Por favor, intentá nuevamente más tarde.";
//       }
//       console.log("Mensaje enviado por WhatsApp:", response);
      
//       return "Pronto recibirás un mensaje por WhatsApp con la información que solicitaste. Gracias por elegir Funny moments";
//     },
  
//     {
//       name: "ENVIAR_WHATSAPP",
//       description:
//         "Envía un mensaje por WhatsApp a FUNNY MOMENTS con el número de teléfono y el mensaje del cliente.",
//       schema: z.object({
//         nombre_cliente: z.string().describe("Nombre del cliente"),
//         number_cel: z.string().describe("Número de teléfono del cliente"),
//         consulta_cliente: z.string().describe("Consulta del cliente"),
//       }),
//     },
//   );

//   export const responseMessage = async (
//     business_phone_number_id: string,
//     WEBHOOK_VERIFY_TOKEN: string,
//     template: object,
//   ) => {
//     // Send a reply message
//     try {
//       const response = await fetch(
//         `https://graph.facebook.com/v22.0/${business_phone_number_id}/messages`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${WEBHOOK_VERIFY_TOKEN}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(template),
//         },
//       );
  
//       const result = await response.json();
  
//       console.log("Message sent successfully:", result);
//       return result;
//     } catch (error) {
//       console.error("Error sending message:", error);
//     }
//   };
  