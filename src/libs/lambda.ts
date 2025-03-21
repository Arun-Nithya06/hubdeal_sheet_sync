import middy from "@middy/core";
import middyJsonBodyParser from "@middy/http-json-body-parser";
import { AWS } from "@serverless/typescript";

export type AWSFunction = AWS["functions"][0];
export const middyfy = (handler) => {
  return middy(handler).use(middyJsonBodyParser());
};
