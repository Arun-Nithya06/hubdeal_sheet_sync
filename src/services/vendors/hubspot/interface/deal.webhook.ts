export interface WebhookEventType {
  eventId: number;
  subscriptionId: number;
  portalId: number;
  appId: number;
  occurredAt: number;
  subscriptionType: string;
  attemptNumber: number;
  objectId: number;
  propertyName: string;
  propertyValue: string;
  changeSource: string;
  sourceId: string;
}
