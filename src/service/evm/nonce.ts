import { ethers } from "ethers";
import { EVMChainConfig } from "../../models/Chain";

export async function getNonce(address: string, chainConfig: EVMChainConfig) {

  const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrls[0])
  const nonce = await provider.getTransactionCount(address)
  return nonce;
}