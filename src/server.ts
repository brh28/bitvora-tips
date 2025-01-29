import express, { Response } from "express";
import { config } from "dotenv";
import { BitvoraClient } from "bitvora";
import { BitcoinNetwork } from "bitvora/dist/types";
config();

const app = express();
const PORT = process.env.PORT;
const BITVORA_API_KEY = process.env.BITVORA_API_KEY;

app.use(express.json());

const sseClients: Response[] = [];

app.use(express.static("./assets/images"));
app.set("view engine", "ejs");
app.set("views", "./views"); // Folder for EJS templates

app.get("/", async (req, res) => {
  const transactions = await fetchTransactions();

  const topTransactions = transactions.data
    .sort((a, b) => b.amount_sats - a.amount_sats)
    .slice(0, 3);

  res.render("spinner", {
    lnAddress: process.env.LIGHTNING_ADDRESS,
    topTransactions: topTransactions,
  });
});

// New route to fetch top transactions on page load
app.get("/top-transactions", async (req, res) => {
  const transactions = await fetchTransactions();

  const topTransactions = transactions.data
    .sort((a, b) => b.amount_sats - a.amount_sats)
    .slice(0, 3);

  let data = topTransactions;

  res.json({ data });
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

app.post("/tip", async (req, res) => {
  const { amount_sats } = req.body.data;

  // Fetch transactions from external API
  const transactions = await fetchTransactions();

  // Sort transactions by amount_sats in descending order and take the top 3
  const topTransactions = transactions.data
    .sort((a, b) => b.amount_sats - a.amount_sats)
    .slice(0, 3);

  // Send updated data to clients
  sseClients.forEach((client: Response) => {
    client.write(
      `data: ${JSON.stringify({ amount_sats, topTransactions })}\n\n`
    );
  });

  res.status(200).send("Tip recorded successfully");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const fetchTransactions = async () => {
  const bitvora = BitvoraClient(BITVORA_API_KEY, BitcoinNetwork.MAINNET);
  return await bitvora.getTransactions();
};

export default app;
