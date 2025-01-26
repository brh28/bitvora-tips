import express, { Response } from "express";
import { config } from "dotenv";
config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

const sseClients: Response[] = [];

app.use(express.static("./assets/images"));
app.set("view engine", "ejs");
app.set("views", "./views"); // Folder for EJS templates

app.get("/", (req, res) => {
  res.render("spinner", {
    lnAddress: process.env.LIGHTNING_ADDRESS,
  });
});

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  sseClients.push(res);

  const keepAlive = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(keepAlive);
  });
});

app.post("/tip", (req, res) => {
  const { amount_sats } = req.body.data;

  sseClients.forEach((client: Response) => {
    client.write(`data: ${JSON.stringify({ amount_sats })}\n\n`);
  });

  res.status(200).send("Tip recorded successfully");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
