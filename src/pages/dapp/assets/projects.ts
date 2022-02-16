export type CategoryType =
  | 'DEX'
  | 'NFT'
  | 'Bridge'
  | 'Farm'
  | 'Gaming'
  | 'Launchpad'
  | 'Lending'
  | 'Metaverse'
  | 'News'
  | 'Yield Optimiser'
  | 'Options'
  | 'Others'
  | 'Reserve Currency'
  | 'Stablecoin'
  //   | 'Structured Finance'
  | 'Tools';
//   | 'Wallet'
//   | 'Web3';

export const categories: CategoryType[] = [
  'DEX',
  'NFT',
  'Bridge',
  'Farm',
  'Gaming',
  'Launchpad',
  'Lending',
  'Metaverse',
  'News',
  'Yield Optimiser',
  'Options',
  'Others',
  'Reserve Currency',
  'Stablecoin',
  //   'Structured Finance',
  'Tools',
  //   'Wallet',
  //   'Web3',
];

export interface CronosProject {
  id: number;
  name: string;
  category: CategoryType[];
  description: string;
  logo: string;
  link: string;
  twitter: string;
}

export const projects: CronosProject[] = [
  {
    id: 1,
    name: 'VVS Finance',
    category: ['DEX', 'Launchpad'],
    description:
      'VVS Finance is your gateway to the decentralized finance movement.Take control of your finances and earn sparkly VVS rewards.',
    logo: '8glAYOTM_400x400.png',
    link: 'https://vvs.finance/',
    twitter: 'https://twitter.com/VVS_finance',
  },
  {
    id: 2,
    name: 'Tectonic',
    category: ['Lending'],
    description:
      'Tectonic is the first lending and borrowing platform of the Cronos ecosystem, powered by the TONIC governance token. ',
    logo: 'V2mMsNnH_400x400.png',
    link: 'https://tectonic.finance/',
    twitter: 'https://twitter.com/TectonicFi',
  },
  {
    id: 3,
    name: 'Cronos Bridge',
    category: ['Bridge'],
    description:
      'Cronos Bridge is a Decentralised Bridge service providing the safest, fastest and the most secure way to transfer assets to and from Cronos',
    logo: 'CGzQIEVX_400x400.png',
    link: 'https://cronos.crypto.org/bridge/',
    twitter: 'https://twitter.com/cronos_chain',
  },
  {
    id: 4,
    name: 'MM Finance',
    category: ['DEX', 'Launchpad'],
    description:
      'MM.Finance has the most complete and holistic ecosystem on Cronos Chain with its AMM/DEX, Yield Optimizer & NFT.',
    logo: 'g7GDg3bv_400x400.png',
    link: 'https://mm.finance/',
    twitter: 'https://twitter.com/MMFcrypto',
  },
  {
    id: 5,
    name: 'CronaSwap',
    category: ['DEX', 'Launchpad'],
    description:
      'A growing network of DeFi Apps. · Swap, earn, and build on the leading decentralized crypto trading protocol',
    logo: 'uCNqopYX_400x400.png',
    link: 'https://app.cronaswap.org/',
    twitter: 'https://twitter.com/cronaswap',
  },
  {
    id: 6,
    name: 'Cronos Chimp Club',
    category: ['NFT'],
    description:
      '10,000 uniquely generated Chimps on the Cronos Chain with various traits that celebrate the different aspects of the Cronos ecosystem.',
    logo: 'vjQcypIM_400x400.png',
    link: 'https://cronoschimp.club/',
    twitter: 'https://twitter.com/CronosChimpClub',
  },
  {
    id: 7,
    name: 'Multichain',
    category: ['Bridge'],
    description:
      'Anyswap is a fully decentralized cross chain swap protocol, based on Fusion DCRM technology, with automated pricing and liquidity system. Anyswap enables swaps between any coins on any blockchain which uses ECDSA or EdDSA as signature algorithm, including BTC, ETH, USDT, XRP, LTC, FSN, etc.',
    logo: 'xJJkFcXG_400x400.png',
    link: 'https://anyswap.exchange/',
    twitter: 'https://twitter.com/MultichainOrg',
  },
  {
    id: 8,
    name: 'Beefy Finance',
    category: ['Yield Optimiser'],
    description:
      'Beefy is a Multichain Yield Optimizer that focuses on safety and autocompounds crypto assets',
    logo: 'zZGuZFMh_400x400.png',
    link: 'https://www.beefy.finance/',
    twitter: 'https://twitter.com/beefyfinance',
  },
  {
    id: 12,
    name: 'ChronoSwap',
    category: ['DEX'],
    description:
      'Chronoswap is one the very first decentralized exchange (DEX) on Cronos Blockchain focused on offering a premier trading experience.',
    logo: 'DQ4Xa1u__400x400.png',
    link: 'https://chronoswap.org/',
    twitter: 'https://twitter.com/Chrono_swap',
  },
  {
    id: 13,
    name: 'Crodex',
    category: ['DEX', 'Launchpad'],
    description:
      'CRODEX aims to be a complete trading ecosystem, covering all aspects of DeFi. Our Whitepaper provides a complete overview of our mission.',
    logo: 'j9UTZnAh_400x400.png',
    link: 'https://crodex.app/',
    twitter: 'https://twitter.com/crodexapp',
  },
  {
    id: 14,
    name: 'Crosmonauts',
    category: ['NFT'],
    description:
      "Cronos Crosmonauts is an extremely limited collection of 1000 unique NFT's on the Cronos blockchain.",
    logo: 'VNkWg0qu_400x400.png',
    link: 'https://www.crosmonauts.club/',
    twitter: 'https://twitter.com/crosmonaut',
  },
  {
    id: 15,
    name: 'ElkFinance',
    category: ['DEX'],
    description:
      'The Elk blockchain enables fast, safe, cheap, and trustless cross-chain value exchange across all blockchains. We aim to break down barriers between chains',
    logo: 'ltcWLpfU_400x400.png',
    link: 'https://elk.finance/',
    twitter: 'https://twitter.com/elk_finance',
  },
  {
    id: 16,
    name: 'Crocos NFT',
    category: ['NFT'],
    description:
      'CrocosNFT is a collection of 2000 Crypto Crocodile NFTs – unique digital collectibles living in their natural habitat; the brand new Cronos Blockchain.',
    logo: '5E1nW_0q_400x400.png',
    link: 'https://crocosnft.com/',
    twitter: 'https://twitter.com/CrocosNFT',
  },
  {
    id: 17,
    name: 'KryptoDex',
    category: ['DEX'],
    description:
      'No liquidity, no problem. Trade any coin you want. Thanks to multirouting. Start Swapping.',
    logo: '4dx5Fu6u_400x400.png',
    link: 'https://www.kryptodex.org/',
    twitter: 'https://twitter.com/KryptoDex',
  },
  {
    id: 18,
    name: 'Kyber DMM',
    category: ['DEX'],
    description:
      "KyberSwap is DeFi's first Dynamic Market Maker; a decentralized exchange protocol that provides frictionless crypto liquidity",
    logo: 'L7katIIr_400x400.png',
    link: 'https://kyberswap.com/',
    twitter: 'https://twitter.com/KyberDAO',
  },
  {
    id: 19,
    name: 'PhotonSwap',
    category: ['DEX'],
    description: 'Photonswap Analytics. Pairs. WCRO-DxP Pair · WCRO-PHOTON Pair · WCRO-ICY Pair',
    logo: 'Qja-gRn8_400x400.png',
    link: 'https://photonswap.finance/',
    twitter: 'https://twitter.com/photonswap_fi',
  },
  {
    id: 20,
    name: 'SmolSwap',
    category: ['DEX'],
    description: 'SmolSwap allows for swapping of ERC20 compatible tokens across multiple networks',
    logo: 'ZGHto9CG_400x400.png',
    link: 'https://www.smolswap.com/swap',
    twitter: 'https://twitter.com/SmolSwap',
  },
  {
    id: 21,
    name: 'StormSwap',
    category: ['DEX'],
    description:
      'A Storm has made its way to Avalanche. Swap, Earn and Build on the Leading Decentralized crypto trading protocol',
    logo: 'DijhzPqV_400x400.png',
    link: 'https://stormswap.finance/',
    twitter: 'https://twitter.com/stormswapfi',
  },
  {
    id: 22,
    name: 'Swapp',
    category: ['DEX'],
    description:
      'Swapp is reinventing the data marketplace by cutting out the middlemen and allowing the individual user to monetize their own data.',
    logo: 'xXaVgqrp_400x400.png',
    link: 'https://swapp.ee/',
    twitter: 'https://twitter.com/SwappFi',
  },
  {
    id: 23,
    name: 'Firebird',
    category: ['DEX'],
    description: 'Firebird Finance. DeFi multi-chain yield farms deployer & DEXs aggregator.',
    logo: 'LXva7UjX_400x400.png',
    link: 'https://firebird.finance/',
    twitter: 'https://twitter.com/FinanceFirebird',
  },
  {
    id: 24,
    name: 'Liquidus',
    category: ['Farm'],
    description:
      'Liquidus makes staking your crypo assets a walk in the park. No more switching pages, no more manual calculating',
    logo: 'z8J88QHo_400x400.png',
    link: 'https://liquidus.finance/',
    twitter: 'https://twitter.com/LiquidusFinance',
  },
  {
    id: 25,
    name: 'Salem Finance',
    category: ['Farm'],
    description:
      'The newest Spooky moonshot! Trade safely on SpookySwap the magic takes a few seconds, earn by staking in our magic vaults and pools',
    logo: 'LsV18cZg_400x400.png',
    link: 'https://salem.finance/',
    twitter: 'https://twitter.com/SalemFinance',
  },
  {
    id: 26,
    name: 'Zeus Finance',
    category: ['Farm'],
    description:
      'Zeus Finance is a decentralized hybrid yield optimizer (yield farm and yield aggregator) based in the community feedback. Join Us on Cronos Chain!',
    logo: '5LuuYJbQ_400x400.png',
    link: 'https://www.zeusfinance.app/',
    twitter: 'https://twitter.com/ZeusFinanceCro',
  },
  {
    id: 27,
    name: 'Cryptoshoujo',
    category: ['Gaming'],
    description:
      'AI -GENERATED COLLECTIBLE ANIME GIRLS. Get a unique cute anime girl, trade the cards, or use them to fight for rewards. ',
    logo: 'dkVUGK-F_400x400.png',
    link: 'https://cryptoshoujo.io/',
    twitter: 'https://twitter.com/hibikifinance?lang=en',
  },
  {
    id: 28,
    name: 'DeFi Degen Land',
    category: ['Gaming'],
    description:
      'DeFi Degen Land is the Next Generation Gamified DeFi & Metaverse. HODL & get rewarded with Bitcoin.',
    logo: 'FsdFk51S_400x400.png',
    link: 'https://defidegenland.com/',
    twitter: 'https://twitter.com/DeFi_Degen_Land',
  },
  {
    id: 31,
    name: 'DexPad',
    category: ['Launchpad'],
    description:
      'DexPad - Decentralized Exchange Platform : create and manage your Tokens, Presales, and Lockers.',
    logo: '52V-Tqnx_400x400.png',
    link: 'https://dexpad.io/',
    twitter: 'https://twitter.com/DexPad',
  },
  {
    id: 32,
    name: 'Agile Finance',
    category: ['Lending'],
    description:
      'Money Markets DeFi platform for lenders and borrowers, that also features own AMM, IDO Launchpad, and NFT Marketplace with Governance AGL token.',
    logo: 'OuZhUINr_400x400.png',
    link: 'https://www.agilefi.org/',
    twitter: 'https://twitter.com/agiledefi',
  },
  {
    id: 33,
    name: 'Annex Finance',
    category: ['DEX', 'Lending'],
    description:
      'Annex finance is not the first decentralized financial platform that is attempting to bridge the traditional lending platform with blockchains.',
    logo: 'MSqYjFB9_400x400.png',
    link: 'https://www.annex.finance/',
    twitter: 'https://twitter.com/AnnexFinance',
  },
  {
    id: 34,
    name: 'Mimas Finance',
    category: ['Lending'],
    description:
      'Mimas Finance is an algorithmic money market and liquid staking protocol on the Cronos blockchain.',
    logo: '74q3YvFb_400x400.png',
    link: 'https://mimas.finance/',
    twitter: 'https://twitter.com/mimas_fi',
  },
  {
    id: 35,
    name: 'TheCronicle',
    category: ['News'],
    description:
      'The #1 source for Cronos Chain news, updates, interviews, tutorials, op-eds, token prices and more!',
    logo: '0S8xCrPo_400x400.png',
    link: 'https://thecronicle.com/',
    twitter: 'https://twitter.com/TheCronicleNews',
  },
  {
    id: 36,
    name: 'Cronos News',
    category: ['News'],
    description: 'Find all the newest info on Cronos and more',
    logo: 'K2dAmk3c_400x400.png',
    link: 'https://twitter.com/News_Cronos',
    twitter: 'https://twitter.com/News_Cronos',
  },
  {
    id: 37,
    name: 'Agora',
    category: ['NFT'],
    description: 'Global NFT MarketPlace Powered On Arbitrum and Cronos.',
    logo: 'XcdQvwmw_400x400.png',
    link: 'https://agoracro.com/',
    twitter: 'https://twitter.com/AgoramarketNFT',
  },
  {
    id: 38,
    name: 'CRO Crow',
    category: ['NFT'],
    description: 'CRO CROW is the first NFT deployed on Cronos Chain.',
    logo: 'bHEK4pyP_400x400.png',
    link: 'https://crocrow.com/',
    twitter: 'https://twitter.com/cronoscrocrow',
  },
  {
    id: 39,
    name: 'Empire Dex',
    category: ['DEX'],
    description: 'EmpireDEX is a Multi-Chain DEX Protocol',
    logo: 'PadJgPPH_400x400.png',
    link: 'https://bsc.empiredex.org/',
    twitter: 'https://twitter.com/Empire_DEX',
  },
  {
    id: 40,
    name: 'EvoDeFi',
    category: ['Bridge'],
    description:
      "Access cross-chain opportunities on ‍the World's Leading Blockchains using Relay's simple, fast, and secure bridge.",
    logo: 'mkdBMMhs_400x400.png',
    link: 'https://evodefi.com/',
    twitter: 'https://twitter.com/evolution_bsc',
  },
  {
    id: 41,
    name: 'CroPunks',
    category: ['NFT'],
    description:
      'CroPunks is a collection of over 1111 punks with unique attributes and styles. Punks are definitely popular with NFT collectors as they are officially 100% sold out',
    logo: 'OzhB0zBV_400x400.png',
    link: 'https://stake.cropunks.art/',
    twitter: 'https://twitter.com/PUNKSONCRONOS',
  },
  {
    id: 42,
    name: 'Ducky DeFi',
    category: ['DEX'],
    description:
      'Cheapest, fastest and simplest! Discover DuckyDeFi, the first fair launch DEX on Cronus Chain with the best farms and pools in DeFi.',
    logo: 'nnWW2ydX_400x400.png',
    link: 'https://duckydefi.com/',
    twitter: 'https://twitter.com/duckydefi',
  },
  {
    id: 43,
    name: 'EbisuBay',
    category: ['NFT'],
    description:
      'The first NFT marketplace on Cronos. Create, buy, sell, trade and enjoy the #CroFam NFT community.',
    logo: 'sxSZj7kw_400x400.png',
    link: 'https://app.ebisusbay.com/',
    twitter: 'https://twitter.com/EbisusBay',
  },
  {
    id: 44,
    name: 'Mad Meerkat',
    category: ['NFT'],
    description:
      'Each Genesis Mad Meerkat grants you the absolute ownership of your NFT, and backs you as an entrant to the wholly owned Burrow.',
    logo: 'ATYOILyW_400x400.png',
    link: 'https://madmeerkat.io/',
    twitter: 'https://twitter.com/MadMeerkatNFT',
  },
  {
    id: 45,
    name: 'Petite Planets',
    category: ['NFT'],
    description:
      "We're creating 10,000 unique and beautiful NFT planets. Based on our solar system and beyond, which will live on the Cronos chain",
    logo: 'Xc1TIhyS_400x400.png',
    link: 'https://petiteplanets.com/',
    twitter: 'https://twitter.com/PetitePlanets',
  },
  {
    id: 46,
    name: 'SupBirds',
    category: ['NFT'],
    description:
      'SupBirds are 5000 unique bird characters that live on Cronos Blockchain. Each Sup Bird comes with proof of ownership as a CRO NFT',
    logo: '005bXle3_400x400.png',
    link: 'https://www.supbirds.com/',
    twitter: 'https://twitter.com/SupBirdsNFT',
  },
  {
    id: 47,
    name: 'Adamant Finance',
    category: ['Yield Optimiser'],
    description:
      'Adamant is a yield optimizer platform that provides users with an easy and safe way to maximize their yield farming income.',
    logo: 'DSBHnq2-_400x400.png',
    link: 'https://adamant.finance/',
    twitter: 'https://twitter.com/AdamantVault',
  },
  {
    id: 48,
    name: 'Autofarm',
    category: ['Yield Optimiser'],
    description:
      'Autofarm is a DeFi Yield Aggregator. Stake your assets and earn optimized yield on BSC, HECO and Polygon.',
    logo: 'wz6Vh6VM_400x400.png',
    link: 'https://autofarm.network/',
    twitter: 'https://twitter.com/autofarmnetwork',
  },
  {
    id: 49,
    name: 'CroBlanc',
    category: ['Yield Optimiser'],
    description: 'Dual Yield Optimizer. The Alpha Dog every Cronos chain user needs.',
    logo: '1J-t8_cq_400x400.png',
    link: 'https://app.croblanc.com/',
    twitter: 'https://twitter.com/croblancdotcom',
  },
  {
    id: 50,
    name: 'CROFarm',
    category: ['Yield Optimiser'],
    description: 'The CroFarm, New Protocol of Yield Farming on CRONOS.',
    logo: 'wP83VJge_400x400.png',
    link: 'https://www.crofarm.app/',
    twitter: 'https://twitter.com/cro_farm',
  },
  {
    id: 51,
    name: 'Crystl Finance',
    category: ['Yield Optimiser'],
    description: 'Come Explore the DeFi Universe at Crystl Finance with High APY Vaults and Pools.',
    logo: 'Gk3OZ2UD_400x400.png',
    link: 'https://www.crystl.finance/',
    twitter: 'https://twitter.com/CrystlFinance',
  },
  {
    id: 52,
    name: 'Kafe Finance',
    category: ['Yield Optimiser'],
    description: 'Have a Kafe! Come join us at KafeFinance, the coolest Cronos farm there is.',
    logo: 'btG_wQof_400x400.png',
    link: 'https://cro.kafe.finance/',
    twitter: 'https://twitter.com/kafefinance',
  },
  {
    id: 53,
    name: 'Meso Finance',
    category: ['Yield Optimiser'],
    description: 'Meso Vaults. Stake LP Tokens to autocompound Profits.',
    logo: 'x0FvGKB4_400x400.png',
    link: 'https://www.meso.finance/',
    twitter: 'https://twitter.com/mesofinance',
  },
  {
    id: 54,
    name: 'Thetanuts',
    category: ['Options'],
    description:
      'Thetanuts Finance Is the first cross chain structured products protocol on Ethereum and BSC with automated vaults to earn yield on a variety of cryptos.',
    logo: 'qqSbOuOK_400x400.png',
    link: 'https://thetanuts.finance/',
    twitter: 'https://twitter.com/ThetaNuts',
  },
  {
    id: 55,
    name: 'IcyCRO',
    category: ['Others'],
    description:
      'The community token of the Cronos · Mission. Controlled decentralisation. High quality, low fees. Built for the CRO community.',
    logo: 'r_gd5J0c_400x400.png',
    link: 'https://www.icycro.org/',
    twitter: 'https://twitter.com/IcyCro',
  },
  {
    id: 56,
    name: 'FortuneDao',
    category: ['Reserve Currency'],
    description:
      'FortuneDAO on Cronos generates high yield and return on staking through bond offering and utilizing Treasury Reserve Currencys to provide Protocol-Owned Stablecoins ...',
    logo: 'YzvVq6j9_400x400.png',
    link: 'https://www.fortunedao.com/',
    twitter: 'https://twitter.com/Fortune_DAO',
  },
  {
    id: 57,
    name: 'PegasusDAO',
    category: ['Reserve Currency'],
    description: 'In the Pegasus ecosystem, the Foundation is the chief democratic governing force',
    logo: 'w2Pg9BGv_400x400.png',
    link: 'https://www.pegasusdao.com/',
    twitter: 'https://twitter.com/pegasusdaofi',
  },
  {
    id: 58,
    name: 'DNA Dollar',
    category: ['Stablecoin'],
    description:
      'Stake your DNA or DSHARE LP in the Replicator to earn $DSHARE rewards. Then stake your earned $DSHARE in the Laboratory to earn more $DNA!',
    logo: 'ifh8hApd_400x400.png',
    link: 'https://dnadollar.com/',
    twitter: 'https://twitter.com/dna_dollar',
  },
  {
    id: 59,
    name: 'Debank',
    category: ['Tools'],
    description:
      'DeBank.com is your overall #DeFi portfolio tracking wallet with most trusted source of #ETH #DEX data dashboard.',
    logo: 'YzVitob7_400x400.png',
    link: 'https://debank.com/',
    twitter: 'https://twitter.com/DeBankDeFi',
  },
  {
    id: 60,
    name: 'DeFiLlama',
    category: ['Tools'],
    description:
      'DefiLlama is a DeFi TVL aggregator. It is committed to providing accurate data without ads or sponsored content, as well as transparency.',
    logo: 'LQwS_x0l_400x400.png',
    link: 'https://defillama.com/',
    twitter: 'https://twitter.com/DefiLlama',
  },
  {
    id: 61,
    name: 'Dex Screener',
    category: ['Tools'],
    description:
      'Realtime price charts and trading history on DEXes across Ethereum, BSC, Polygon, Avalanche, Fantom, Harmony, Cronos, Arbitrum, Optimism and more.',
    logo: '5UYqudVs_400x400.png',
    link: 'https://dexscreener.com/',
    twitter: 'https://twitter.com/dexscreener',
  },
  {
    id: 62,
    name: 'Bogged Finance',
    category: ['Tools'],
    description:
      'A tool to provide quick access to Bogged.Finance charts and orders on commonly used crypto platforms',
    logo: '2BmPGIKA_400x400.png',
    link: 'https://www.bogged.finance/',
    twitter: 'https://twitter.com/boggedfinance',
  },
  {
    id: 67,
    name: 'CroMarket.app',
    category: ['DEX'],
    logo: 'cromarket.app-small-s.png',
    description:
      "We're all-in-one dex based on Cronos chain (live streaming charts + swap feature for more than 20 liquidity providers)",
    link: 'https://cromarket.app/',
    twitter: 'https://twitter.com/cromarketapp',
  },
  {
    id: 68,
    name: 'DarkCrypto Finance',
    category: ['Stablecoin'],
    logo: 'darkcrypto-dark.png',
    description:
      'DarkCrypto Finance is an algorithmic token pegged to CRO enabling the generation of DARK tokens',
    link: 'https://www.darkcrypto.finance/',
    twitter: 'https://twitter.com/DarkCryptoFi',
  },
  {
    id: 69,
    name: 'Metaverse Pixels',
    category: ['NFT', 'Metaverse', 'Farm'],
    logo: 'metaverse-pixels-logo.png',
    description:
      'Metaverse pixels is a nft related platform running on CRONOS, is a big grid where you can get pixels from the grid as NFT and submit your own content (image, detail, link), we also have MetaPx Token that is used to get pixels and yield farming',
    link: 'https://www.metaversepixels.app/',
    twitter: 'https://twitter.com/MetaversePixels',
  },
  {
    id: 70,
    name: 'Cronos Research',
    category: ['Tools'],
    logo: 'cronos-research-logo.png',
    description:
      'Cronos Research is #1 resource for an overview on Cronos projects. All information in one place, easy-to-use search and DeFi/NFT Analytics.',
    link: 'https://www.cronosresearch.com/',
    twitter: 'https://twitter.com/croresearch',
  },
  {
    id: 71,
    name: 'Panels Project',
    category: ['NFT', 'Gaming'],
    logo: 'panels-project-logo.png',
    description:
      'Panels Project is an NFT collection that will result in a multiplayer video game and a metaverse integration.',
    link: 'https://www.panelsproject.com/',
    twitter: 'https://twitter.com/PanelsProject',
  },
  {
    id: 72,
    name: 'CroSea',
    category: ['NFT', 'Launchpad'],
    logo: 'crosea-logo.png',
    description:
      'The first open NFT marketplace on Cronos to buy, sell, auction, mint and trade Cronos based NFT.',
    link: 'https://www.crosea.io/',
    twitter: 'https://twitter.com/croseanft',
  },
  {
    id: 73,
    name: 'The Crobees',
    category: ['NFT'],
    logo: 'the-crobees-logo.png',
    description: 'A colony of 2222 crobees invade the cronos chain. Join them and build the hive.',
    link: 'https://www.crobees.com/',
    twitter: 'https://twitter.com/The_Crobees',
  },
  {
    id: 74,
    name: 'Reckless Robots NFT',
    category: ['NFT'],
    logo: 'reckless-robots-logo.png',
    description:
      'Reckless Robots is a collection of 2100 unique and detailed hand-drawn NFTs deployed on the Cronos Chain. Distinctive features for the project are NFT staking and eliminations (burning). Eliminations are conducted by buying the weakest bids from secondary markets and burning the NFTs. Eliminated NFTs are commemorated in the community.',
    link: 'https://www.recklessrobotsnft.com',
    twitter: 'https://twitter.com/recklessrobots',
  },
  {
    id: 75,
    name: 'Crodo',
    category: ['Launchpad'],
    logo: 'crodo-logo.png',
    description: 'IDO on Cronos network',
    link: 'https://crodo.io/',
    twitter: 'https://twitter.com/Crodo_io',
  },
  {
    id: 76,
    name: 'Cronos Ragdolls',
    category: ['NFT', 'Metaverse'],
    logo: 'cronos-ragdolls-logo.png',
    description:
      'Based on two real-life Ragdoll cats, the Cronos Ragdolls NFT provides utility by building a decentralized metaverse NFT art gallery that adjusts to your Cronos wallet.',
    link: 'https://www.cronosragdolls.com/',
    twitter: 'https://twitter.com/CronosRagdolls',
  },
];
