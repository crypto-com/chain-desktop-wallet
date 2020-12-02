import {Wallet} from "../models/Wallet";
import {WalletNetworkType} from "./WalletNetworkType";
import {DefaultConfigs, WalletConfig} from "../config/StaticConfig";

export class WalletImporter {
    public static import(options: WalletImportOptions): Wallet {

        return {address: "", config: DefaultConfigs.MainNetConfig}
    }

    public static importWithCustomConfigs(options: WalletImportOptions, customConfigs: WalletConfig): Wallet {

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

