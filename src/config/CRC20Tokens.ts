export interface CRC20TokenInfo {
  address: string;
  // is tradable on VVS
  isWhitelist: boolean;
  iconURL: string;
}

// https://cronos.crypto.org/explorer/tokens
// don't know why all response from tokenlist returns lowercased contract address
// it's definitely not correct to use lowercased contract address here
export const CRC20MainnetTokenInfos: Map<string, CRC20TokenInfo> = new Map([
  [
    'WBTC',
    {
      address: '0x062e66477faf219f25d27dced647bf57c3107d52',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5eb427298eadfb009885d309/WBTC_4x.png',
      isWhitelist: true,
    },
  ],
  [
    'WETH',
    {
      address: '0xe44fd7fcb2b1581822d0c862b68222998a0c299a',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5fc4d2ba3deadb00995dbfc5/WETH-xxxhdpi.png',
      isWhitelist: true,
    },
  ],
  [
    'DAI',
    {
      address: '0xf2001b145b43032aaf5ee2884e456ccd805f677d',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5e01c4cd49cde700adb27b0d/DAIxxxhdpi.png',
      isWhitelist: true,
    },
  ],
  [
    'USDC',
    {
      address: '0xc21223249ca28397b4b6541dffaecc539bff0c59',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1251c25afb9500ec2d2ff3/coin_log_usd-coin.png',
      isWhitelist: true,
    },
  ],
  [
    'WCRO',
    {
      address: '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1248c15568a4017c20aa87/cro.png',
      isWhitelist: true,
    },
  ],
  [
    'VVS',
    {
      address: '0x2d03bece6747adc00e1a131bba1469c15fd11e03',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/61711b671ef47000c5ac9f78/VVS_Finance_Logo_Token_Symbol-White.png',
      isWhitelist: true,
    },
  ],
  [
    'USDT',
    {
      address: '0x66e428c3f67a68878562e79a0234c1f83c208770',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c12487f5568a4017c20a999/tether.png',
      isWhitelist: true,
    },
  ],
  [
    'SHIB',
    {
      address: '0xbed48612bc69fa1cab67052b42a95fb30c1bcfee',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5f979d61acbd0e009941ca04/SHIBxxxhdpi.png',
      isWhitelist: true,
    },
  ],
  [
    'BIFI',
    {
      address: '0xe6801928061cdbe32ac5ad0634427e140efd05f9',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5f979dd0acbd0e009941cbf0/BIFI_8.png',
      isWhitelist: true,
    },
  ],
  [
    'ATOM',
    {
      address: '0xb888d8dd1733d72681b30c00ee76bde93ae7aa93',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5cc8dba7d436cf008a5ad9cd/cosmos.png',
      isWhitelist: true,
    },
  ],
  [
    'DOGE',
    {
      address: '0x1a8e39ae59e5556b56b76fcba98d22c9ae557396',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1248835568a4017c20a9a6/dogecoin.png',
      isWhitelist: true,
    },
  ],
  [
    'TONIC',
    {
      address: '0xdd73dea10abc2bff99c60882ec5b2b81bb1dc5b2',
      iconURL: '',
      isWhitelist: true,
    },
  ],
  [
    'LINK',
    {
      address: '0xbc6f24649ccd67ec42342accdceccb2efa27c9d9',
      iconURL: '',
      isWhitelist: true,
    },
  ],
  [
    'ENJ',
    {
      address: '0x0a92ea8a197919acb9bc26660ed0d43d01ed26b7',
      iconURL: '',
      isWhitelist: true,
    },
  ],
  [
    'SWAPP',
    {
      address: '',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/610b8b87d07aba00c6590f3b/SWAPP_cronos_4.png',
      isWhitelist: false,
    },
  ],
  [
    'CRONA',
    {
      address: '',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/619de338a4396a00c5b30250/CRONA_4.png',
      isWhitelist: false,
    },
  ],
  [
    'ELK',
    {
      address: '',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/619de4423363e600c5f22dbc/ELK_4.png',
      isWhitelist: false,
    },
  ],
  [
    'SMOL',
    {
      address: '',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/61a4da089a45a100c53b189f/SMOL_4.png',
      isWhitelist: false,
    },
  ],
]);
