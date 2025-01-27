import { BitvoraClient } from "bitvora";
import express, { Response } from "express";
import { config } from "dotenv";
import { BitcoinNetwork, GetTransactionsResponse, Transaction } from "bitvora/dist/types";
config();

const app = express();
const PORT = process.env.PORT;
const BITVORA_KEY = process.env.BITVORA_API_KEY
app.use(express.json());

const sseClients: Response[] = [];

app.use(express.static("./assets/images"));
app.set("view engine", "ejs");
app.set("views", "./views"); // Folder for EJS templates


const bitvora = BitvoraClient(BITVORA_KEY, BitcoinNetwork.MAINNET); 

async function getTopTrxs(): Promise<any[]> {
  
  return (await bitvora.getTransactions())
    .data
    .sort((t1, t2) => t2.amount_sats - t1.amount_sats)
    .slice(0, 5)
    // .map(({ id }) => await bitvora.getDeposit(id))
}

app.get("/", async (req, res) => {
  // console.log(`transactions = ${JSON.stringify(await getTopTrxs())}`)
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

app.post("/tip", async (req, res) => {
  const { lightning_invoice_id, amount_sats } = req.body.data;
  const invoice = await bitvora.getLightningInvoice(lightning_invoice_id)
  const { value, memo } = invoice.data
  console.log(`invoice data ${JSON.stringify(invoice.data)}`)

  sseClients.forEach((client: Response) => {
    client.write(`data: ${JSON.stringify({ amount_sats, value, memo })}\n\n`);
  });

  res.status(200).send();
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
