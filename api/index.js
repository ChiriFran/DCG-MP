import express from "express";
import cors from "cors";
import createPreference from "./create_preference.js";

const app = express();

app.use(cors());
app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente 🚀");
});

// Rutas específicas
app.use("/create_preference", createPreference);

// Exportamos el servidor para Vercel
export default app;
