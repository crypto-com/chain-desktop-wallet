import {Wallet} from "../models/Wallet";
import {WalletImportOptions} from "./WalletImporter";
import {WalletNetworkType} from "./WalletNetworkType";
import {DefaultConfigs} from "../config/StaticConfig";

export class WalletCreator {
    public create(options: WalletCreateOptions): Wallet {

        return {address: "", config: DefaultConfigs.MainNetConfig}
    }
}

export class WalletCreateOptions {
    public readonly networkType: WalletNetworkType;

    constructor(networkType: WalletNetworkType) {
        this.networkType = networkType;
    }
}
