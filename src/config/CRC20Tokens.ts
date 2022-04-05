export interface CRC20TokenInfo {
  address: string;
  // is tradable on VVS
  isWhitelisted: boolean;
  iconURL: string;
}

// https://cronos.org/explorer/tokens
// case doesn't matter, will change to checksum before comparison
export const CRC20MainnetTokenInfos: Map<string, CRC20TokenInfo> = new Map([
  [
    'WBTC',
    {
      address: '0x062e66477faf219f25d27dced647bf57c3107d52',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5eb427298eadfb009885d309/WBTC_4x.png',
      isWhitelisted: true,
    },
  ],
  [
    'WETH',
    {
      address: '0xe44fd7fcb2b1581822d0c862b68222998a0c299a',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5fc4d2ba3deadb00995dbfc5/WETH-xxxhdpi.png',
      isWhitelisted: true,
    },
  ],
  [
    'DAI',
    {
      address: '0xf2001b145b43032aaf5ee2884e456ccd805f677d',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5e01c4cd49cde700adb27b0d/DAIxxxhdpi.png',
      isWhitelisted: true,
    },
  ],
  [
    'USDC',
    {
      address: '0xc21223249ca28397b4b6541dffaecc539bff0c59',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1251c25afb9500ec2d2ff3/coin_log_usd-coin.png',
      isWhitelisted: true,
    },
  ],
  [
    'WCRO',
    {
      address: '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1248c15568a4017c20aa87/cro.png',
      isWhitelisted: true,
    },
  ],
  [
    'VVS',
    {
      address: '0x2d03bece6747adc00e1a131bba1469c15fd11e03',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/61711b671ef47000c5ac9f78/VVS_Finance_Logo_Token_Symbol-White.png',
      isWhitelisted: true,
    },
  ],
  [
    'USDT',
    {
      address: '0x66e428c3f67a68878562e79a0234c1f83c208770',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c12487f5568a4017c20a999/tether.png',
      isWhitelisted: true,
    },
  ],
  [
    'SHIB',
    {
      address: '0xbed48612bc69fa1cab67052b42a95fb30c1bcfee',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5f979d61acbd0e009941ca04/SHIBxxxhdpi.png',
      isWhitelisted: true,
    },
  ],
  [
    'BIFI',
    {
      address: '0xe6801928061cdbe32ac5ad0634427e140efd05f9',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5f979dd0acbd0e009941cbf0/BIFI_8.png',
      isWhitelisted: true,
    },
  ],
  [
    'ATOM',
    {
      address: '0xb888d8dd1733d72681b30c00ee76bde93ae7aa93',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5cc8dba7d436cf008a5ad9cd/cosmos.png',
      isWhitelisted: true,
    },
  ],
  [
    'DOGE',
    {
      address: '0x1a8e39ae59e5556b56b76fcba98d22c9ae557396',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1248835568a4017c20a9a6/dogecoin.png',
      isWhitelisted: true,
    },
  ],
  [
    'TONIC',
    {
      address: '0xdd73dea10abc2bff99c60882ec5b2b81bb1dc5b2',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/61c14a1bd7bd1900c6dfa2a6/Color-TONIC_4.png',
      isWhitelisted: true,
    },
  ],
  [
    'LINK',
    {
      address: '0xbc6f24649ccd67ec42342accdceccb2efa27c9d9',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c12488b5568a4017c20a9c1/chainlink.png',
      isWhitelisted: true,
    },
  ],
  [
    'ENJ',
    {
      address: '0x0a92ea8a197919acb9bc26660ed0d43d01ed26b7',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1248a35568a4017c20aa1a/enjin-coin.png',
      isWhitelisted: true,
    },
  ],
  [
    'SWAPP',
    {
      address: '0x245a551ee0f55005e510b239c917fa34b41b3461',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/610b8b87d07aba00c6590f3b/SWAPP_cronos_4.png',
      isWhitelisted: false,
    },
  ],
  [
    'CRONA',
    {
      address: '0xadbd1231fb360047525bedf962581f3eee7b49fe',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/619de338a4396a00c5b30250/CRONA_4.png',
      isWhitelisted: false,
    },
  ],
  [
    'ELK',
    {
      address: '0xe1c110e1b1b4a1ded0caf3e42bfbdbb7b5d7ce1c',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/619de4423363e600c5f22dbc/ELK_4.png',
      isWhitelisted: false,
    },
  ],
  [
    'SMOL',
    {
      address: '0x2ad63da83d6ff5da9e716dcae844d4f157405bdd',
      iconURL:
        'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/61a4da089a45a100c53b189f/SMOL_4.png',
      isWhitelisted: false,
    },
  ],
]);
