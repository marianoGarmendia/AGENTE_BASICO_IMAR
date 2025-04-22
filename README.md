### Agente aviva stgo instagram



Stevie AI - Automatizaciones

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.30. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.


LANGGRAPH STUDIO LOCALMENTE

Para ejecutar un servidor de manera local debi instalar:

npx @langchain/langgraph-cli ó npm install -g @langchain/langgraph-cli
> Algunos de los dos , o los dos

Configurar el langgraph.json

```
{
    "node_version": "20",
    "dockerfile_lines": [],
    "dependencies": [
        "."
    ],
    "graphs": {
        "agent": "./graph.ts:workflow"
    },
    "env": "./.env"
}

```
El graph a ejecutar debe estar bien en la ruta, debe ser exportado y no debe tener checkpointer


Luego los comandos:

langgraphjs dev



