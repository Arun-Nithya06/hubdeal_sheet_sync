import { Logger } from "@aws-lambda-powertools/logger";
import { GoogleSheetService } from "./vendors/g-sheet/gsheet.service";
import { HubspotService } from "./vendors/hubspot/hubspot.service";
import { WebhookEventType } from "./vendors/hubspot/interface/deal.webhook";
import sqsService from "./sqs/sqs.service";

export class DealSyncService {
  logger = new Logger({ serviceName: DealSyncService.name });
  private hubspotService: HubspotService;
  private sheetService: GoogleSheetService;
  private sheetName: string;
  private headers: string[];

  constructor() {
    this.hubspotService = new HubspotService();
    this.sheetService = new GoogleSheetService();

    // Sheet name and headers from environment variables (or default values)
    this.sheetName = process.env.G_SHEET_NAME ?? "";
    this.headers = (
      process.env.DEAL_HEADERS ??
      "Deal ID,DEAL NAME,CLOSE DATE (GMT +05:30),DEAL OWNER,SERVICE SOLD,AMOUNT,CONTRACT PERIOD"
    ).split(",");
  }

  private formatDate(isoString: string): string {
    const [year, month, day] = isoString.split("T")[0].split("-");
    return `${day}-${parseInt(month)}-${year}`;
  }

  /**
   * Ensure headers exist and are correctly formatted before updating deals
   */
  async ensureHeaders() {
    this.logger.info(" Ensuring headers are updated...");

    const existingHeaders = await this.sheetService.getHeaders();

    if (
      existingHeaders.length !== this.headers.length ||
      !existingHeaders.every((h, i) => h === this.headers[i])
    ) {
      this.logger.info("Headers are outdated or missing. Updating now...");

      const range = `${this.sheetName}!A1:${String.fromCharCode(65 + this.headers.length - 1)}1`;

      await this.sheetService.updateHeaders(range, [this.headers]);

      this.logger.info(" Headers updated.");
    } else {
      this.logger.info(" Headers are already correct. No update needed.");
    }
  }

  /**
   * Syncs a deal by ID
   */
  async syncDealById(id: string) {
    this.logger.info(`Sync deal by id :${id}`);
    this.logger.info(`Fetching deal from HubSpot: ${id}`);
    const freshDeal = await this.hubspotService.getDealById(id);
    const ownerEmail = await this.hubspotService.getDealOwnerById(
      freshDeal.hubOwnerId
    );
    const closedDate = this.formatDate(freshDeal?.closedate) ?? "";
    if (!freshDeal) {
      this.logger.info(` Deal ${id} not found in HubSpot. Or No sync G sheet`);
      return;
    }

    if (freshDeal?.isPushedGheet?.toLowerCase() === "no") {
      this.logger.info(` Deal ${id} exist but No sync G sheet`);
      return;
    }

    await this.ensureHeaders();

    const existingDeals = await this.sheetService.getExistingDeals(
      this.sheetName
    );
    const rowNumber = existingDeals.get(id);

    const dealData: Record<string, any> = {
      "Deal ID": freshDeal.id,
      "DEAL NAME": freshDeal.dealname,
      "CLOSE DATE (GMT +05:30)": closedDate,
      "DEAL OWNER": ownerEmail?.email,
      "SERVICE SOLD": freshDeal.servicesolid,
      AMOUNT: freshDeal.amount,
      "CONTRACT PERIOD": freshDeal.contractPeroid,
    };

    // Convert dealData into rowData based on dynamic headers
    const rowData = this.headers.map((header) => dealData[header] || "");

    if (rowNumber) {
      this.logger.info(`Updating existing deal at row ${rowNumber}...`);
      await this.sheetService.updateRowByColumnNames(
        rowNumber,
        this.headers,
        rowData,
        this.sheetName
      );
    } else {
      this.logger.info("Adding new deal to Google Sheets...");
      await this.sheetService.appendRow(rowData, this.sheetName);
    }

    this.logger.info(" Sync completed.");
  }

  public async PushToSQS(hubDeals: WebhookEventType[], sqsUrl: string) {
    this.logger.info(`hub deal ids pushed in sqs `);
    const processedDeal = [];
    for (let i = 0; i < hubDeals.length; i++) {
      const item = hubDeals[i];
      const payload = {
        hubSpotDeal: item,
      };
      await sqsService.pushToQueue(payload, sqsUrl);
      this.logger.info(`Processing item at index: ${i}`);
      await new Promise((resolve) => setTimeout(resolve, 10)); // Add a delay of 10ms
    }
    return processedDeal;
  }
}
