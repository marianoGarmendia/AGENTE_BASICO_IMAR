export type ReponseContact = {
    data: [
      {
        code: string | null,
        duplicate_field: string | null,
        action: string | null,
        details: {
          Modified_Time: string | null,
          Modified_By: { name: string | null, id: string | null },
          Created_Time: string,
          id: string, // ID del contacto creado con este id debo crear el trato *********
          Created_By: { name: string, id:string }
        },
        message: string,
        status:string
      }
    ]
  }