/** 
*
*
 @param lead - Objeto que contiene los parámetros necesarios para crear un lead
* 
* 
* 
*/


export const load_lead = async ({lead}:{lead:any}) => {
    console.log("lead", lead);
    
    try {
        const response = await fetch("https://fqfb9bqm-5000.brs.devtunnels.ms/leads/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                lead:lead
            }),
        })
        if(!response.ok) {
            console.error("Error en la respuesta de la API:");
            return {error: "Error en la respuesta de la API"}
        }

        const data = await response.json();
        console.dir(data, { depth: null })
        if (data.status === "success") {
            return data.status

        };
        return null
    } catch (error) {
        throw new Error("ha ocurrido un error" + error); // Re-throw the error for further handling if needed
    }
}