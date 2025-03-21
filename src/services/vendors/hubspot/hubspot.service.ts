import { Client } from "@hubspot/api-client";
import * as dotenv from "dotenv";

dotenv.config();

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY!;

export class HubspotService {
  private hubspotClient: Client;

  constructor() {
    this.hubspotClient = new Client({ accessToken: HUBSPOT_API_KEY });
  }

  async fetchAllDeals(): Promise<
    {
      id: string;
      dealname: string;
      amount: string;
      dealstage: string;
      closedate: string;
    }[]
  > {
    try {
      const response = await this.hubspotClient.crm.deals.basicApi.getPage(
        undefined,
        undefined,
        ["dealname", "amount", "dealstage", "closedate"]
      );
      return response.results.map((deal) => ({
        id: deal.id,
        dealname: deal.properties.dealname || "",
        amount: deal.properties.amount || "",
        dealstage: deal.properties.dealstage || "",
        closedate: deal.properties.closedate || "",
      }));
    } catch (error) {
      console.error("Error fetching deals from HubSpot:", error.message);
      return [];
    }
  }

  async getDealById(id: string) {
    try {
      const deal = await this.hubspotClient.crm.deals.basicApi.getById(id, [
        "dealname",
        "amount",
        "dealstage",
        "closedate",
      ]);
      return {
        id: deal.id,
        dealname: deal.properties.dealname || "",
        amount: deal.properties.amount || "",
        dealstage: deal.properties.dealstage || "",
        closedate: deal.properties.closedate || "",
      };
    } catch (error) {
      console.error(`Error fetching deal ${id}:`, error.message);
      return null;
    }
  }
}
