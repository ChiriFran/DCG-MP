export default async function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).send("Servidor funcionando correctamente 🚀");
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
