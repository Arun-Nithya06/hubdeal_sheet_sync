import * as crypto from "crypto";
import { APIGatewayEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";

class HubSpotWebhookValidator {
  private logger: Logger;
  private clientSecret: string;
  private allowedOrigin: string;

  constructor() {
    this.logger = new Logger({ serviceName: "HubSpotWebhookValidator" });
    this.clientSecret = process.env.HUBSPOT_CLIENT_SECRET!;
    this.allowedOrigin =
      process.env.ALLOWED_ORIGIN! ?? "https://app.hubspot.com";
  }

  public validateSignature(event: APIGatewayEvent): boolean {
    this.logger.info(`Headers Keys: ${Object.keys(event.headers)}`);

    const signatureKey = Object.keys(event.headers).find(
      (key) => key.toLowerCase() === "x-hubspot-signature"
    );

    const requestSignature = signatureKey
      ? event.headers[signatureKey]
      : undefined;

    this.logger.info(
      `Using Signature Key: ${signatureKey}, Value: ${requestSignature}`
    );

    if (!requestSignature) {
      this.logger.error("Missing HubSpot signature", { requestSignature });
      return false;
    }

    const requestBody =
      typeof event.body === "string" ? event.body : JSON.stringify(event.body);

    this.logger.debug("Client Secret:", this.clientSecret);
    this.logger.debug(
      "Source String Before Hashing:",
      this.clientSecret + requestBody
    );

    const computedSignature = crypto
      .createHash("sha256")
      .update(this.clientSecret + requestBody, "utf8")
      .digest("hex");

    this.logger.debug("Computed Signature:", computedSignature);
    this.logger.debug("Received Signature:", requestSignature);

    if (requestSignature !== computedSignature) {
      this.logger.error("Invalid HubSpot signature", {
        computedSignature,
        requestSignature,
      });
      return false;
    }

    return true;
  }

  public validateOrigin(event: APIGatewayEvent): boolean {
    const requestOrigin = event.headers["origin"] || event.headers["referer"];
    if (!requestOrigin || requestOrigin !== this.allowedOrigin) {
      this.logger.error("Invalid request origin:", requestOrigin);
      return false;
    }
    return true;
  }

  public validate(event: APIGatewayEvent): boolean {
    return this.validateSignature(event);
  }
}

const signatureValidator = new HubSpotWebhookValidator();
export default signatureValidator;
