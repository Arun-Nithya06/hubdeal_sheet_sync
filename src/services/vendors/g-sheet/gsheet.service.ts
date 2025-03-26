import { Logger } from "@aws-lambda-powertools/logger";
import * as dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const SPREADSHEET_ID = process.env.G_SHEET_SPREADSHEET_ID ?? "";
const SHEET_NAME = process.env.G_SHEET_NAME ?? "";

export class GoogleSheetService {
  logger = new Logger({ serviceName: GoogleSheetService.name });
  private sheets: any;

  constructor() {
    this.initializeSheets();
  }

  async updateRowByColumnNames(
    rowNumber: number,
    headers: string[],
    rowData: string[],
    sheetName: string
  ) {
    const lastColumnLetter = String.fromCharCode(65 + headers.length - 1);
    const range = `${sheetName}!A${rowNumber}:${lastColumnLetter}${rowNumber}`;

    this.logger.info(`Updating range -> ${range}`);

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      resource: { values: [rowData] },
    });

    this.logger.info(`Row ${rowNumber} updated.`);
  }

  async appendRow(rowData: string[], sheetName?: string) {
    const lastColumnLetter = String.fromCharCode(65 + rowData.length - 1);
    const range = `${sheetName ?? SHEET_NAME}!A1:${lastColumnLetter}1`;

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      resource: { values: [rowData] },
    });

    this.logger.info("New deal added.");
  }

  async getHeaders() {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!1:1`,
    });

    return response.data.values ? response.data.values[0] : [];
  }

  async updateHeaders(range: string, values: string[][]) {
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      resource: { values },
    });
  }

  async initializeSheets() {
    const credentials = {
      type: process.env.G_SHEET_ACCOUNT_TYPE ?? "",
      project_id: process.env.G_SHEET_PROJECT_ID ?? "",
      private_key_id: process.env.G_SHEET_PRIVATE_KEY_ID ?? "",
      private_key: (process.env.G_SHEET_PRIVATE_KEY || "").replace(
        /\\n/g,
        "\n"
      ),
      client_email: process.env.G_SHEET_CLIENT_EMAIL ?? "",
      client_id: process.env.G_SHEET_CLIENT_ID ?? "",
      auth_uri: process.env.G_SHEET_AUTH_URI ?? "",
      token_uri: process.env.G_SHEET_TOKEN_URI ?? "",
      auth_provider_x509_cert_url:
        process.env.G_SHEET_AUTH_PROVIDER_X509_CERT_URL ?? "",
      client_x509_cert_url: process.env.G_SHEET_CLIENT_X509_CERT_URL ?? "",
      universe_domain: process.env.G_SHEET_UNIVERSE_DOMAIN ?? "",
    };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    this.sheets = google.sheets({
      version: "v4",
      auth,
    });
  }

  async getExistingDeals(sheetName: string): Promise<Map<string, number>> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:A`,
    });

    const rows = response.data.values || [];
    const map = new Map<string, number>();

    rows.forEach((row, index) => {
      if (row[0]) map.set(row[0], index + 2);
    });

    return map;
  }

  async updateDeals(
    updates: { row: number; values: string[] }[],
    newRows: string[][]
  ) {
    const requests = [];

    // Process updates
    for (const update of updates) {
      requests.push({
        range: `${SHEET_NAME}!A${update.row}:${String.fromCharCode(65 + update.values.length - 1)}${update.row}`,
        values: [update.values],
      });
    }

    // Process new rows
    if (newRows.length > 0) {
      requests.push({
        range: `${SHEET_NAME}!A${updates.length + 2}:${String.fromCharCode(65 + newRows[0].length - 1)}${updates.length + 2 + newRows.length - 1}`,
        values: newRows,
      });
    }

    await Promise.all(
      requests.map((request) =>
        this.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: request.range,
          valueInputOption: "USER_ENTERED",
          resource: { values: request.values },
        })
      )
    );

    this.logger.info(" Deals updated successfully.");
  }
}
