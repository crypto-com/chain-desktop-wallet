export type WalletConfig = {
    chainId: string;
    nodeUrl: string;
    addressPrefix: string;
    coin: {
        baseDenom: string;
        croDenom: string;
    };
    bip44Path: {
        coinType: number;
        account: number;
    };
};

const TestNetConfig: WalletConfig = {
    addressPrefix: "tcro",
    bip44Path: {account: 0, coinType: 0},
    chainId: "",
    coin: {baseDenom: "", croDenom: ""},
    nodeUrl: ""
}

const MainNetConfig: WalletConfig = {
    addressPrefix: "cro",
    bip44Path: {account: 0, coinType: 0},
    chainId: "",
    coin: {baseDenom: "", croDenom: ""},
    nodeUrl: ""
}


export const DefaultConfigs = {
    TestNetConfig,
    MainNetConfig
}