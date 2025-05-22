import express from "express";
import cors from "cors";
import { parsePhoneNumber } from "./parser-phone-number";
import { workflow } from "./graph";
import { HumanMessage } from "@langchain/core/messages";
import { sendMessageWsp } from "./send_msg_wsp";
import { messageTemplateGeneric } from "./utils/wsp_templates";
import {leadsRouter} from "./Routes/leads.route";
import {contactRouter} from "./Routes/contact.route";
import {tratoRouter} from "./Routes/trato.route";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "";
const WEBHOOK_VERIFY_TOKEN = process.env.TOKEN_VERIFY_WEBHOOK_DEV || "";
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());


app.use("/leads", leadsRouter);
app.use("/contacts", contactRouter);
app.use("/tratos", tratoRouter);

app.post("/mail", (req, res) => {
  console.log("Received mail request");

  console.log(req.body);

  const str = req.body.from;
  const regex = /<([^>]+)>/;
  const match = str.match(regex);

  const response = {
    message: "Mail recibido, gracias por estar en contacto",
    to: match[1],
    subject: req.body.subject,
  };

  res.json(response);
});

app.get("/webhook", (req, res) => {
  console.log("Received webhook request");
  console.log(req.query);
  console.log(req.body);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Asegúrate de usar el mismo token aquí
      console.log("Webhook verified");
      res.status(200).send(challenge); // Envía el challenge de vuelta
    } else {
      res.sendStatus(403); // Token incorrecto
    }
  }
});



  app.post("/webhook", async (req, res) => {
    // console.log("message body:");
    // console.dir(req.body, { depth: null });

    // Chequear en la database si es un lead para gestionar la informacion

    const messages = req.body.entry[0]?.changes[0]?.value?.messages;
    if (!messages || messages.length <= 0) {
      // console.error(
      //   "El mensaje recibido no tiene el formato esperado o no contiene mensajes."
      // );

      res.sendStatus(400).end(); // Bad Request
      return;
    }

    // no tenemos muy bien en claro por que es un array pero agarramos el primer elemento
    // ya que es el unico que nos interesa por ahora
    const firstMessage = messages[0];

    // console.log("firstMessage:", firstMessage);

    const business_phone_number_id =
      req.body.entry[0].changes[0].value.metadata.phone_number_id;
    const cel_number = parsePhoneNumber(firstMessage.from);
    try {
      if (firstMessage.type !== "text") {
        await sendMessageWsp(
         { business_phone_number_id,
        
          WEBHOOK_VERIFY_TOKEN,
         template: {
            ...messageTemplateGeneric,
            to: cel_number,
            text: {
              body: "Solo recibimos mensajes de texto, por favor vuelve a intentarlo",
            },
          }}
        );
        console.log("Message sent successfully, No es un mensaje de texto:", res);
  
        res.sendStatus(200).end();
        // Bad Request
        return; // descomentar para win 2 win
      } // para que no siga ejecutando el codigo
      console.log("Pregunando al agente");
      // Aca se podría verificar quien es y en caso de quien sea se deriva a un lado o a otro
      
      // iniciamos el agente para que analice el mensaje
      if (firstMessage.text.body) {
        const responseGraph = await workflow.invoke(
          {
            // context: enterpriseContext.bot_context,
  
            messages: firstMessage.text.body,
            mobile: cel_number,
          },
          {
            configurable: { thread_id: cel_number },
            streamMode: "values",
          }
        );
        console.log(
          responseGraph.messages[responseGraph.messages.length - 1].content
        );
  
        const res2 = await sendMessageWsp(
         { business_phone_number_id,
    
          WEBHOOK_VERIFY_TOKEN,
          template: {
            ...messageTemplateGeneric,
            to: cel_number,
            text: {
              body: responseGraph.messages[responseGraph.messages.length - 1]
                .content,
            },
          }}
        );
        console.log("respuesta de agente");
        console.log("Message sent successfully:", res2);
  
        // Respond to the webhook
        res.sendStatus(200).end();
        return
      }

      console.error("El mensaje no tiene el formato esperado.");
      res.sendStatus(400).end(); // Bad Request
      return; // descomentar para win 2 win
      
    } catch (error) {
      res.sendStatus(500).end(); // Internal Server Error
      console.error("Error:", error);
      return; // descomentar para win 2 win
    }
   
  });


 
    
  


// ENPOINT PARA  QUE EL AGENTE ENVIE UN MENSAJE AL LEAD DE ZOHO QUE QUIERE RECUPERAR INFORMACION
// EN DESARROLLO
app.post("/zoho", async (req, res) => {
  console.log("Received zoho request");
  console.dir(req.body, { depth: null });
  const { lead_id, message, number_phone, campos_faltantes } = req.body;

  const response = await workflow.invoke(
    {
      messages: [new HumanMessage(message)],
    },
    { configurable: { thread_id: lead_id } }
  );
  const responseMessage =
    response.messages[response.messages.length - 1].content;

  res.status(200).json(responseMessage);
  return;
});

// Twilio
app.post("/twilio", async (req, res) => {
  console.log("Received twilio request");
  console.dir(req.body, { depth: null });

  res.json({ message: "Mensaje recibido" });
});

// fetch("http://localhost:3000/mail", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify({
//     key: "foo",
//   }),
// });

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
