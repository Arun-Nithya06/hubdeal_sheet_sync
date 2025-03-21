import { GoogleSheetService } from "./vendors/g-sheet/gsheet.service";
import { HubspotService } from "./vendors/hubspot/hubspot.service";

export class DealSyncService {
  private hubspotService: HubspotService;
  private sheetService: GoogleSheetService;

  constructor() {
    this.hubspotService = new HubspotService();
    this.sheetService = new GoogleSheetService();
  }

  /**
   * Ensure headers exist and are correctly formatted before updating deals
   */
  async ensureHeaders(headers: string[]) {
    console.log("🔄 Ensuring headers are updated...");

    const existingHeaders = await this.sheetService.getHeaders();

    if (
      existingHeaders.length !== headers.length ||
      !existingHeaders.every((h, i) => h === headers[i])
    ) {
      console.log("⚠️ Headers are outdated or missing. Updating now...");

      const range = `Deals!A1:${String.fromCharCode(65 + headers.length - 1)}1`;

      await this.sheetService.updateHeaders(range, [headers]);

      console.log("✅ Headers updated.");
    } else {
      console.log("✅ Headers are already correct. No update needed.");
    }
  }

  /**
   * Syncs a deal by ID
   */
  async syncDealById(id: string) {
    const headers = ["ID", "Deal Name", "Amount", "Deal Stage", "Close Date"];

    // Ensure headers are correct before updating rows
    await this.ensureHeaders(headers);

    console.log(`Fetching deal from HubSpot: ${id}`);
    const freshDeal = await this.hubspotService.getDealById(id);

    if (!freshDeal) {
      console.log(`❌ Deal ${id} not found in HubSpot.`);
      return;
    }

    const existingDeals = await this.sheetService.getExistingDeals();
    const rowNumber = existingDeals.get(id);

    const dealData: Record<string, any> = {
      ID: freshDeal.id,
      "Deal Name": freshDeal.dealname,
      Amount: freshDeal.amount,
      "Deal Stage": freshDeal.dealstage,
      "Close Date": freshDeal.closedate,
    };

    // Convert dealData into rowData based on the headers
    const rowData = headers.map((header) => dealData[header] || "");

    if (rowNumber) {
      console.log(`🔄 Updating existing deal at row ${rowNumber}...`);
      await this.sheetService.updateDeals(
        [{ row: rowNumber, values: rowData }],
        []
      );
    } else {
      console.log("➕ Adding new deal to Google Sheets...");
      await this.sheetService.updateDeals([], [rowData]);
    }

    console.log("✅ Sync completed.");
  }
}
