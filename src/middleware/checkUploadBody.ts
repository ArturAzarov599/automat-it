import { Request, Response, NextFunction } from "express";

import { isMatch } from "date-fns";

export const checkUploadBody = (
  request: Request<any, any, Express.Multer.File, { invoicingMonth: string }>,
  response: Response,
  next: NextFunction
) => {
  try {
    const file = request.file;
    const invoicingMonth = request.query.invoicingMonth;

    if (!invoicingMonth) {
      response
        .status(400)
        .send({ message: "Missing query parameter invoicingMonth" });
      return;
    }
    if (!isMatch(invoicingMonth, "yyyy-MM")) {
      response
        .status(400)
        .send({ message: "Wrong `invoicingMonth` format. Needs YYYY-MM" });

      return;
    }

    if (!file) {
      response.status(400).send({ message: "Missing file" });

      return;
    }

    if (
      file?.mimetype !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      response.status(400).send({ message: "Incorrect type, need .xlxs" });
      return;
    }

    next();
  } catch {
    response.status(500).send({ message: "Something went wrong" });
  }
};
