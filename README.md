# Exec File Parser

## Introduction
Exec File Parser is an Express.js application designed to parse Excel (xlsx) files, validate their content, and calculate the total price for each record in the table. The application provides an endpoint to upload xlsx files and returns the parsed data along with validation results and calculated totals.

## Installation
To install the necessary dependencies, run: npm i

## Usage
To use the application, start the server and use the following endpoint to upload your xlsx file:

POST http://localhost:3000/api/v1/invoice/upload?invoicingMonth=YYYY-MM

Ensure that the file field in the form is named data.