import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { Request, Response } from "express";

import xlsx from "xlsx";

const readFile = (filePath: string) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  return data;
};

interface IRate {
  currency: string;
  value: number;
}

type TRequiredField =
  | "Customer"
  | "Cust No'"
  | "Project Type"
  | "Quantity"
  | "Price Per Item"
  | "Item Price Currency"
  | "Total Price"
  | "Invoice Currency"
  | "Status";

interface IFields {
  Customer: string;
  "Cust No'": string;
  "Project Type": string;
  Quantity: string;
  "Price Per Item": string;
  "Item Price Currency": string;
  "Total Price": string;
  "Invoice Currency": string;
  Status: string;
  [key: string]: any;
}

const REQUIRED_FIELDS: TRequiredField[] = [
  "Customer",
  "Cust No'",
  "Project Type",
  "Quantity",
  "Price Per Item",
  "Item Price Currency",
  "Total Price",
  "Invoice Currency",
  "Status",
];

class InvoiceController {
  static async parseExcelFile(
    req: Request<any, any, Express.Multer.File, { invoicingMonth: string }>,
    res: Response
  ): Promise<void> {
    try {
      const filePath = `uploads/${req.file?.filename}`;
      const parserExcelFile = readFile(filePath) as Record<
        string,
        string | number
      >[];
      let tableColumnsRecord: Record<string, string | number> = {};
      const currencyRates: IRate[] = [];
      let tableRecordIdx: number | null = null;

      parserExcelFile.map((object, idx) => {
        const values = Object.values(object);
        const rateValue = values.find(
          (value) => typeof value === "string" && value.includes("Rate")
        );

        // Searching for currencies. Assuming that currency will have the same structure as in the file { "Sep 2023": "USD Rate", __EMPTY: 3.849 },
        if (rateValue && typeof rateValue === "string" && values.length === 2) {
          const [currency] = rateValue.split(" ");
          currencyRates.push({ currency, value: +values[1] });
        }

        // if object contains equal or bigger values length as REQUIRED_FIELDS that it can be assuming as object with columns names
        if (values.length >= REQUIRED_FIELDS.length) {
          const matchesTotal = values.filter((value) =>
            REQUIRED_FIELDS.includes(`${value}` as TRequiredField)
          ).length;

          if (matchesTotal >= REQUIRED_FIELDS.length) {
            tableColumnsRecord = object;
            tableRecordIdx = idx;
          }
        }
      });

      if (Object.keys(tableColumnsRecord).length < REQUIRED_FIELDS.length)
        res.status(400).send({ message: "Wrong columns!" });

      const swappedObj = Object.keys(tableColumnsRecord).reduce(
        (newObj, key) => {
          const [value, newKey] = [tableColumnsRecord[key], key];
          newObj = {
            ...newObj,
            [value]: newKey,
          };
          return newObj;
        },
        {}
      ) as Record<keyof IFields, string | number>;

      const statusValue = swappedObj["Status"];
      const invoiceValue = swappedObj["Invoice #"];
      const invoicesData: any[] = [];

      const validatedInvoice = (object: Record<string, string | number>) => {
        const validationErrors: Record<string, string>[] = [];

        REQUIRED_FIELDS.map((requiredField) => {
          if (!Object.keys(object).includes(`${swappedObj[requiredField]}`)) {
            validationErrors.push({
              [requiredField]: `Field ${requiredField} missing`,
            });
            return;
          }
        });

        const total = parseFloat(`${object[swappedObj["Total Price"]]}`) || 0;
        const currency = currencyRates.find(
          (rate) => rate.currency === object[swappedObj["Invoice Currency"]]
        )?.value;

        let invoiceTotal = total * (currency || 0);

        return {
          ...object,
          "Invoice Total": invoiceTotal || "Missing data for calculation",
          validationErrors,
        };
      };

      // get invoice objects
      parserExcelFile.map((object, idx) => {
        const status = object[statusValue];

        // if object contains some of required files I assume that it
        if (
          idx !== tableRecordIdx &&
          ((typeof status === "string" && status?.toLowerCase() === "ready") ||
            object[invoiceValue])
        )
          invoicesData.push(validatedInvoice(object));
      });

      const parsedDate = parse(
        `${swappedObj["Customer"]}`,
        "MMM yyyy",
        new Date()
      );
      const formattedDate = format(parsedDate, "yyyy-MM");

      res.status(200).send({
        InvoicingMonth: formattedDate,
        currencyRates,
        invoicesData,
      });
    } catch {
      res.status(500).send({ message: "Something went wrong" });
    }
  }
}

export default InvoiceController;
