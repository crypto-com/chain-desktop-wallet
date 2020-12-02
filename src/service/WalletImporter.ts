import {Wallet} from "../models/Wallet";
import {WalletNetworkType} from "./WalletNetworkType";
import {DefaultConfigs} from "../config/StaticConfig";

export class WalletImporter {
    public import(options: WalletImportOptions): Wallet {

        return {address: "", config: DefaultConfigs.MainNetConfig}
    }
}

export class WalletImportOptions {
    public readonly networkType: WalletNetworkType;
    public readonly phrase: string;

    constructor(networkType: WalletNetworkType, phrase: string) {
        this.networkType = networkType;
        this.phrase = phrase;
    }
}

