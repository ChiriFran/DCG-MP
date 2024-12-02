export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).send({ message: "Servidor funcionando correctamente 🚀" });
  }
  res.setHeader("Allow", ["GET"]);
  res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
