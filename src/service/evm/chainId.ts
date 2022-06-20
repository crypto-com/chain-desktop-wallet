import { EVMChainConfig } from "../../models/Chain";

export function parseChainId(chainConfig: EVMChainConfig) {
  return parseInt(chainConfig.chainId, 16);
}