import { Resend } from "resend";

const resend = new Resend("re_V5RJx9ia_7qZ5ybU4WCpNEVwVc8TyDTne");

(async function () {
  const { data, error } = await resend.emails.send({
    from: "Mariano <contacto@marianodev.site>",
    to: ["marianogarmendia77@gmail.com"],
    subject: "Hello World",
    html: "<strong>It works! Somos IMAR</strong>",
  });

  if (error) {
    return console.error({ error });
  }

  console.log({ data });
})();

// const res = await resend.domains.get("9660352d-81ed-4cfc-9726-3d249ffe42b3");
// console.log(res);
