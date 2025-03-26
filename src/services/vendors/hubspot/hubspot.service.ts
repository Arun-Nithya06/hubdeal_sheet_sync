import { Logger } from "@aws-lambda-powertools/logger";
import { Client } from "@hubspot/api-client";
import * as dotenv from "dotenv";

dotenv.config();

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY!;

export class HubspotService {
  logger = new Logger({ serviceName: HubspotService.name });
  private hubspotClient: Client;

  constructor() {
    this.hubspotClient = new Client({
      accessToken: HUBSPOT_API_KEY ?? "",
    });
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
        [
          "dealname",
          "amount",
          "dealstage",
          "closedate",
          "services_sold__c",
          "push_to_gsheet",
          "hubspot_owner_id",
        ]
      );
      return response.results.map((deal) => ({
        id: deal.id,
        dealname: deal.properties.dealname || "",
        amount: deal.properties.amount || "",
        dealstage: deal.properties.dealstage || "",
        closedate: deal.properties.closedate || "",
      }));
    } catch (error) {
      return [];
    }
  }

  async getDealById(id: string) {
    try {
      this.logger.info(`Get deal by id: ${id}`);
      const deal = await this.hubspotClient.crm.deals.basicApi.getById(id, [
        "dealname",
        "amount",
        "dealstage",
        "closedate",
        "services_sold__c",
        "push_to_gsheet",
        "hubspot_owner_id",
        "contract_period",
      ]);
      return {
        id: deal?.id,
        dealname: deal?.properties.dealname || "",
        amount: deal?.properties.amount || "",
        dealstage: deal?.properties.dealstage || "",
        closedate: deal?.properties.closedate || "",
        servicesolid: deal?.properties?.services_sold__c ?? "",
        isPushedGheet: deal?.properties?.push_to_gsheet ?? "",
        hubOwnerId: deal?.properties?.hubspot_owner_id ?? "",
        contractPeroid: deal?.properties?.contract_period ?? "",
      };
    } catch (error) {
      this.logger.error(`Error fetching deal ${id}:`, error.message);
      return null;
    }
  }

  async getDealOwnerById(id: string) {
    try {
      this.logger.info(`Get deal owner by id: ${id}`);
      return await this.hubspotClient.crm.owners.ownersApi.getById(Number(id));
    } catch (e) {
      this.logger.error(JSON.stringify(e));
    }
  }
}
