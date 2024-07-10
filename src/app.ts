import express, { Express } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import invoiceRouter from "@routes/invoice.router";

dotenv.config();

const app: Express = express();
const port = process.env.APP_PORT;

app.use(bodyParser.json());

app.use("/api/v1/invoice", invoiceRouter);

app.listen(port, () => {
  console.log(`[server]: server is running on port: ${port}`);
});
