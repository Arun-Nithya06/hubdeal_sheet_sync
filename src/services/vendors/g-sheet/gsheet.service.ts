import * as dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID ?? "18kxziXM4hYJOhJy5o5i8iWm9958x4xN83WwrYFsudzA";
const SHEET_NAME = process.env.SHEET_NAME ?? "Deals";

export class GoogleSheetService {
  private sheets: any;

  constructor() {
    this.initializeSheets();
  }

  async updateRowByColumnNames(
    rowNumber: number,
    headers: string[],
    rowData: string[]
  ) {
    const lastColumnLetter = String.fromCharCode(65 + headers.length - 1);
    const range = `Deals!A${rowNumber}:${lastColumnLetter}${rowNumber}`;

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      resource: { values: [rowData] },
    });

    console.log(`✅ Row ${rowNumber} updated.`);
  }

  async appendRow(rowData: string[]) {
    const lastColumnLetter = String.fromCharCode(65 + rowData.length - 1);
    const range = `Deals!A1:${lastColumnLetter}1`;

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      resource: { values: [rowData] },
    });

    console.log("✅ New deal added.");
  }

  async getHeaders() {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Deals!1:1",
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
    // const credentials = {
    //   type: "service_account",
    //   project_id: process.env.GOOGLE_PROJECT_ID,
    //   private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    //   client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // };
    const credentials = {
      type: "service_account",
      project_id: "oceanic-monitor-433712-c8",
      private_key:
        "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDosnWlT3PI1GVh\nike31CRb7YwjKLJaTZgC/u+yzOuDgslonH61QudaC/VZM3WIrPl6IzxkMYAESMgM\n+EmXfAkwqcZ7MzuluDBsuuGSCzRDbWSTG3qxD+agnzIR7E4IDvbGGu9KaVDEfAmA\niBevgC8PRS7nrP6cxbPKydkpQdQb9PXKZ0X/ONnouNogz1iIZUy4bzc8ru3LyGAq\niGpRGvEVOPkX8HP248/OOt6H7KHD2gsf6e90O1UsmeRyOSfOf/nV/FigFmUUPBZy\nWi4qSzYm8wKeFkucPGMeK4YFHi/QS9xuZEyS8fcqCUVGoy8jRHTx3Sm7QA7OtQ9T\nsekXEIKHAgMBAAECggEAbo3O8BXB9EHY0tEwRqm/Bn/jKxccOWQRGydE+YV7RVV/\nXDixyGt7YCA7VkBpEGDh/EG+YPnVkPOFPAhAanyvHxQiLQlHxvGt7BKTtd+l2n0g\nIfYVwgbEcz5/Ot2yqwh0/OTyGD/V9CvcFdlSq3pyoUYkxUQ/CXuycl+Y0Y2peQfu\nE94jPub37WP0WreE205sJd8VULZ2t/mOADGZYRGGabWgk45dbw3rK7YAZZeIuR2f\ngmlz/h5oUvT32RC73oeulU9OXmo3LuSDozR+KjVZM6CMKgJvj0bVQSEVRdPvdO2p\nPEP8mxfDZay/m2qP8Dwv1ryGYB9AA/fNz0Iw6l92HQKBgQD/FaignZf1U5t0Ba61\nIwothEeMF7g/5sjcEeo17FpvadMY9vzqvaxQBK+zQ0oJHdEJ9qU5etzsZRd31h5x\nsoKLqlIi2EPp8rE6AbaErpOpAixM7u0Ubo1noN7mAnBXruHaiIYTUpwq6amH/cLN\ni2iONM/ZB7jbTp2X7ni13wR5EwKBgQDpiDvgWjLCI13JTjC+iahDjeUJesboHj6j\nuT9n716G2O0aK2CKo2lc56vVZfFF1jVU6KcxbcqKIeb+5JNE4TpXUWZoMwWxs+b7\nkf1+w9KW9OcBw8bIaF0kR0ZZNFujxlsjB0zpWLOjXmcz2L/cYEQOJYDwOHuaZSmV\nyGuR45fTPQKBgQCEYd0t3hvq+gUHZZuR7iluDeSD1BuPLlq3u6Rtb8hPYgBoSGZh\n/SXcMVJuGlHmAU9neFWvSxA0rxJK4xjRsO8HRNFzvAEi/Qz1KcZrfZ6sa7BKDQWF\nQQqp6VdEz6c2GlCkdY3/oTPjIXkWVqAuxFby1n24CMXrKxWmr+B9osxTeQKBgQCR\npTZ6qKZpb7cpOkuqOZ4oa5GBhQISd/JnF7yUrLQOc7IEFTODo4CtwYrob0i3Xm4q\ng2Lqr+eWmKhBJfs3BSTmmky9Bb0yY9nV4enwKl7naNu9vQT3ricQ3ibgsYfJr4bd\nZMsx6PE4HUNOEYsu/RbUn803hHKKCzeRQ8ra1M+2nQKBgQCGOJNvotV9frpPXsXQ\nVwrOQ48L44iNHTEi0lw3TQD9oLD53sYz3F9X0CIyOvez47qUKREruFcWe1+hZGxv\nt0TvLedmIYi8Dlm6yVudAzMJMlru6BbCpiHudfKgv9VPv+OT9LAr+R7MGQewY8qm\n3scI8p2WEk4DPXfJ+lTehux+ZQ==\n-----END PRIVATE KEY-----\n",
      client_email:
        "demo-434@oceanic-monitor-433712-c8.iam.gserviceaccount.com",
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

  async getExistingDeals(): Promise<Map<string, number>> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Deals!A2:A",
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
        range: `Deals!A${update.row}:${String.fromCharCode(65 + update.values.length - 1)}${update.row}`,
        values: [update.values],
      });
    }

    // Process new rows
    if (newRows.length > 0) {
      requests.push({
        range: `Deals!A${updates.length + 2}:${String.fromCharCode(65 + newRows[0].length - 1)}${updates.length + 2 + newRows.length - 1}`,
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

    console.log("✅ Deals updated successfully.");
  }
}

// async initializeSheets() {
//   const credentials = {
//     type: "service_account",
//     project_id: "oceanic-monitor-433712-c8",
//     private_key_id: "5ac5181c0d3f6d9a6de61b70a8b6eb4ddbb86f5d",
//     private_key:
//       "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDosnWlT3PI1GVh\nike31CRb7YwjKLJaTZgC/u+yzOuDgslonH61QudaC/VZM3WIrPl6IzxkMYAESMgM\n+EmXfAkwqcZ7MzuluDBsuuGSCzRDbWSTG3qxD+agnzIR7E4IDvbGGu9KaVDEfAmA\niBevgC8PRS7nrP6cxbPKydkpQdQb9PXKZ0X/ONnouNogz1iIZUy4bzc8ru3LyGAq\niGpRGvEVOPkX8HP248/OOt6H7KHD2gsf6e90O1UsmeRyOSfOf/nV/FigFmUUPBZy\nWi4qSzYm8wKeFkucPGMeK4YFHi/QS9xuZEyS8fcqCUVGoy8jRHTx3Sm7QA7OtQ9T\nsekXEIKHAgMBAAECggEAbo3O8BXB9EHY0tEwRqm/Bn/jKxccOWQRGydE+YV7RVV/\nXDixyGt7YCA7VkBpEGDh/EG+YPnVkPOFPAhAanyvHxQiLQlHxvGt7BKTtd+l2n0g\nIfYVwgbEcz5/Ot2yqwh0/OTyGD/V9CvcFdlSq3pyoUYkxUQ/CXuycl+Y0Y2peQfu\nE94jPub37WP0WreE205sJd8VULZ2t/mOADGZYRGGabWgk45dbw3rK7YAZZeIuR2f\ngmlz/h5oUvT32RC73oeulU9OXmo3LuSDozR+KjVZM6CMKgJvj0bVQSEVRdPvdO2p\nPEP8mxfDZay/m2qP8Dwv1ryGYB9AA/fNz0Iw6l92HQKBgQD/FaignZf1U5t0Ba61\nIwothEeMF7g/5sjcEeo17FpvadMY9vzqvaxQBK+zQ0oJHdEJ9qU5etzsZRd31h5x\nsoKLqlIi2EPp8rE6AbaErpOpAixM7u0Ubo1noN7mAnBXruHaiIYTUpwq6amH/cLN\ni2iONM/ZB7jbTp2X7ni13wR5EwKBgQDpiDvgWjLCI13JTjC+iahDjeUJesboHj6j\nuT9n716G2O0aK2CKo2lc56vVZfFF1jVU6KcxbcqKIeb+5JNE4TpXUWZoMwWxs+b7\nkf1+w9KW9OcBw8bIaF0kR0ZZNFujxlsjB0zpWLOjXmcz2L/cYEQOJYDwOHuaZSmV\nyGuR45fTPQKBgQCEYd0t3hvq+gUHZZuR7iluDeSD1BuPLlq3u6Rtb8hPYgBoSGZh\n/SXcMVJuGlHmAU9neFWvSxA0rxJK4xjRsO8HRNFzvAEi/Qz1KcZrfZ6sa7BKDQWF\nQQqp6VdEz6c2GlCkdY3/oTPjIXkWVqAuxFby1n24CMXrKxWmr+B9osxTeQKBgQCR\npTZ6qKZpb7cpOkuqOZ4oa5GBhQISd/JnF7yUrLQOc7IEFTODo4CtwYrob0i3Xm4q\ng2Lqr+eWmKhBJfs3BSTmmky9Bb0yY9nV4enwKl7naNu9vQT3ricQ3ibgsYfJr4bd\nZMsx6PE4HUNOEYsu/RbUn803hHKKCzeRQ8ra1M+2nQKBgQCGOJNvotV9frpPXsXQ\nVwrOQ48L44iNHTEi0lw3TQD9oLD53sYz3F9X0CIyOvez47qUKREruFcWe1+hZGxv\nt0TvLedmIYi8Dlm6yVudAzMJMlru6BbCpiHudfKgv9VPv+OT9LAr+R7MGQewY8qm\n3scI8p2WEk4DPXfJ+lTehux+ZQ==\n-----END PRIVATE KEY-----\n",
//     client_email:
//       "demo-434@oceanic-monitor-433712-c8.iam.gserviceaccount.com",
//     client_id: "102368769790824063492",
//     auth_uri: "https://accounts.google.com/o/oauth2/auth",
//     token_uri: "https://oauth2.googleapis.com/token",
//     auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
//     client_x509_cert_url:
//       "https://www.googleapis.com/robot/v1/metadata/x509/demo-434%40oceanic-monitor-433712-c8.iam.gserviceaccount.com",
//     universe_domain: "googleapis.com",
//   };

//   const auth = new google.auth.GoogleAuth({
//     credentials, // Pass JSON object instead of a file
//     scopes: ["https://www.googleapis.com/auth/spreadsheets"],
//   });

//   this.sheets = google.sheets({
//     version: "v4",
//     auth, // Use auth instance
//   });
// }
