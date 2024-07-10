import { Router } from "express";
import multer from "multer";

import InvoiceController from "@controllers/invoice.controller";
import { checkUploadBody } from "src/middleware/checkUploadBody";

const invoiceRouter = Router();
const upload = multer({
  dest: "uploads/",
});

invoiceRouter.post(
  "/upload",
  upload.single("data"),
  checkUploadBody,
  InvoiceController.parseExcelFile
);

export default invoiceRouter;
