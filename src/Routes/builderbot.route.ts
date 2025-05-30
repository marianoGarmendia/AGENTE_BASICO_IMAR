import  {Router}  from 'express';
import {workflow} from "../graph";


export const conversationRouter = Router();



conversationRouter.post("/agent", async (req, res):Promise<any> => {
  const {query , from }=req.body 
  let config = { configurable: { thread_id: from  } };
  console.log("Mensaje recibido", query);
  
  const responseGraph = await workflow.invoke({messages: query},{...config, streamMode: "values"});
  console.log("Respuesta de agente", responseGraph);
  
  res.status(200).json(responseGraph.messages[responseGraph.messages.length - 1].content);

})



