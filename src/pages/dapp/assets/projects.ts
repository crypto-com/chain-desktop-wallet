export type CategoryType =
  | 'DEX'
  | 'Farm'
  | 'Launchpad'
  | 'Lending'
  | 'Metaverse'
  | 'NFT'
  | 'Reserve Currency'
  | 'Stablecoin'
  | 'Staking'
  | 'Yield Aggregator'
  | 'Yield';

export const categories: CategoryType[] = [
  'DEX',
  'Farm',
  'Launchpad',
  'Lending',
  'Metaverse',
  'NFT',
  'Reserve Currency',
  'Stablecoin',
  'Staking',
  'Yield Aggregator',
  'Yield',
];

export interface CronosProject {
  name: string;
  category: CategoryType[];
  description: string;
  logo: string;
  link: string;
  twitter: string;
}

const defillamaProjects: CronosProject[] = [
  {
    name: 'VVS Finance',
    category: ['DEX'],
    description:
      'VVS is designed to be the simplest DeFi platform for users to swap tokens, earn high yields, and most importantly have fun!',
    logo: 'vvs-finance.jpg',
    link: 'https://vvs.finance',
    twitter: 'https://twitter.com/VVS_finance',
  },
  {
    name: 'Beefy Finance',
    category: ['Yield Aggregator'],
    description:
      'Beefy Finance is a Decentralized, Multi-Chain Yield Optimizer platform that allows its users to earn compound interest on their crypto holdings. Through a set of investment strategies secured and enforced by smart contracts, Beefy Finance automatically maximizes the user rewards from various liquidity pools (LPs),‌ ‌automated market making (AMM) projects,‌ ‌and‌ ‌other yield‌ farming ‌opportunities in the DeFi ecosystem.',
    logo: 'beefy-finance.png',
    link: 'https://app.beefy.finance',
    twitter: 'https://twitter.com/beefyfinance',
  },
  {
    name: 'MM Finance',
    category: ['DEX'],
    description: '1st AMM & DEX on Cronos Chain that offers fee rebate via trading mining',
    logo: 'mm-finance.jpg',
    link: 'https://mm.finance',
    twitter: 'https://twitter.com/MMFcrypto',
  },
  {
    name: 'Tectonic',
    category: ['Lending'],
    description:
      'Tectonic is a cross-chain money market for earning passive yield and accessing instant backed loans',
    logo: 'tectonic.png',
    link: 'https://tectonic.finance/',
    twitter: 'https://twitter.com/TectonicFi',
  },
  {
    name: 'Autofarm',
    category: ['Yield Aggregator'],
    description:
      'The Autofarm ecosystem is a one-stop DeFi suite for all users. Autofarm aggregate yield opportunities using vaults and best swap rates using a DEX aggregator (AutoSwap). In addition, other products such as AutoAnalytics, AutoTrade & AutoPortfolio are set to go live later in 2021. The platform is currently live on BSC, HECO, Polygon, Avalanche, Fantom & Moonriver, with more chains to be introduced soon.',
    logo: 'autofarm.png',
    link: 'https://autofarm.network/',
    twitter: 'https://twitter.com/autofarmnetwork',
  },
  {
    name: 'MM Optimizer',
    category: ['Yield'],
    description:
      'MM Optimizer aims to provide users the easiest way to join the bandwagon of the DeFi world, built on top of MM Finance, giving you the tastiest MMFs topped with MMOs.',
    logo: 'mmo-finance.png',
    link: 'https://vaults.mm.finance/vault',
    twitter: 'https://twitter.com/MMFcrypto',
  },
  {
    name: 'KyberSwap',
    category: ['DEX'],
    description:
      'Kyber Network is connecting the fragmented tokenized world by enabling instant and seamless transactions between platforms, ecosystems.',
    logo: 'kyberswap.png',
    link: 'https://kyber.network/',
    twitter: 'https://twitter.com/KyberNetwork',
  },
  {
    name: 'CronaSwap',
    category: ['DEX'],
    description:
      'CronaSwap is a decentralized exchange platform for swapping ERC-20 tokens on the Cronos Chain network.',
    logo: 'cronaswap.png',
    link: 'https://app.cronaswap.org',
    twitter: 'https://twitter.com/cronaswap',
  },
  {
    name: 'Pickle',
    category: ['Yield Aggregator'],
    description:
      'Pickle Finance is a yield aggregator, auto-compounding users LP positions saving them time and money. The governance token PICKLE can be staked as DILL, to earn a share of the protocols revenues and boost users farm APY',
    logo: 'pickle.svg',
    link: 'https://pickle.finance/',
    twitter: 'https://twitter.com/picklefinance',
  },
  {
    name: 'YieldWolf',
    category: ['Yield'],
    description: 'Next-generation yield farming automation',
    logo: 'yieldwolf.jpg',
    link: 'https://yieldwolf.finance',
    twitter: 'https://twitter.com/YieldWolf',
  },
  {
    name: 'Elk',
    category: ['DEX'],
    description:
      'Elk Finance is a decentralized network for cross-chain liquidity. The Elk ecosystem will make it seamless for anyone to exchange cryptocurrencies. Our motto is Any chain, anytime, anywhere.',
    logo: 'elk.jpg',
    link: 'https://elk.finance',
    twitter: 'https://twitter.com/elk_finance',
  },
  {
    name: 'DarkCrypto',
    category: ['Stablecoin'],
    description:
      'DarkCrypto Protocol is the first algorithmic token pegged to CRO enabling the generation of DARK tokens that run on the Cronos network',
    logo: 'darkcrypto.svg',
    link: 'https://www.darkcrypto.finance',
    twitter: 'https://twitter.com/DarkCryptoFi',
  },
  {
    name: 'Crodex',
    category: ['DEX'],
    description:
      'Crodex is a decentralized exchange (DEX), providing liquidity and enabling peer-to-peer transactions on Cronos.',
    logo: 'crodex.jpg',
    link: 'https://swap.crodex.app',
    twitter: 'https://twitter.com/crodexapp',
  },
  {
    name: 'Annex',
    category: ['Lending'],
    description:
      'A Decentralized Marketplace for Lenders and Borrowers with Borderless Stablecoins.',
    logo: 'annex.jpg',
    link: 'https://www.annex.finance',
    twitter: 'https://twitter.com/AnnexFinance',
  },
  {
    name: 'Mimas Finance',
    category: ['Lending'],
    description:
      'Mimas Finance is an algorithmic money market and liquid staking protocol on the Cronos blockchain.',
    logo: 'mimas-finance.png',
    link: 'https://mimas.finance/',
    twitter: 'https://twitter.com/mimas_fi',
  },
  {
    name: 'Adamant Finance',
    category: ['Yield'],
    description:
      'Adamant is a yield optimizer vault that provides users with an easy and safe way to automatically compound their tokens on the Matic/Polygon network and maximize their yields.',
    logo: 'adamant-finance.png',
    link: 'https://adamant.finance',
    twitter: 'https://twitter.com/AdamantVault',
  },
  {
    name: 'Crystl Finance',
    category: ['Yield'],
    description:
      'Crystl Finance is a decentralized Vaulting Platform that runs on Polygon and ApeSwap Polygon Exchange, and pays out $CRYSTL, the native currency. With it, you can earn profits from your capital in a way that is fair, transparent, and secure.',
    logo: 'crystl-finance.png',
    link: 'https://www.crystl.finance',
    twitter: 'https://twitter.com/CrystlFinance',
  },
  {
    name: 'Savannah Finance',
    category: ['Stablecoin'],
    description:
      'The first and also largest algorithmic stablecoin platform on Cronos. $SVN is pegged to the price of 1 MMF via seigniorage.',
    logo: 'savannah-finance.png',
    link: 'https://svn.finance',
    twitter: 'https://twitter.com/MMFcrypto',
  },
  {
    name: 'EmpireDEX',
    category: ['DEX'],
    description: '#EmpireDEX is a Multi-Chain DEX Protocol',
    logo: 'empire-dex.jpg',
    link: 'https://app.empiredex.org/farm',
    twitter: 'https://twitter.com/Empire_DEX',
  },
  {
    name: 'CougarSwap',
    category: ['Yield'],
    description: 'Cougar Ecosystem - Advanced Yield Farming On Multiple Chains',
    logo: 'cougarswap.png',
    link: 'https://cougarswap.io',
    twitter: 'https://twitter.com/cougarswap',
  },
  {
    name: 'Crow Finance',
    category: ['DEX'],
    description: 'Built on the Cronos Network. Stake & Swap from your wallet.',
    logo: 'crowfi.jpg',
    link: 'https://crowfi.app/',
    twitter: 'https://twitter.com/crowfi_',
  },
  {
    name: 'Croblanc',
    category: ['Yield'],
    description: 'Defi yield optimizer for Cronos',
    logo: 'croblanc.jpg',
    link: 'https://app.croblanc.com/farms',
    twitter: 'https://twitter.com/croblancdotcom',
  },
  {
    name: 'PhotonSwap Finance',
    category: ['DEX'],
    description: 'AMM styled decentralized exchange (DEX) on Cronos ',
    logo: 'photonswap-finance.jpg',
    link: 'https://photonswap.finance',
    twitter: 'https://twitter.com/photonswap_fi',
  },
  {
    name: 'DuckyDeFi',
    category: ['DEX'],
    description: 'The first fair launch DEX on Cronos Chain.',
    logo: 'duckydefi.png',
    link: 'https://duckydefi.com/',
    twitter: 'https://twitter.com/DuckyDeFi',
  },
  {
    name: 'Minotaur Money',
    category: ['Reserve Currency'],
    description: 'Decentralized Reserve Currency and VC on Cronos Network',
    logo: 'minotaur-money.png',
    link: 'https://minotaur.money/',
    twitter: 'https://twitter.com/Minotaur_Money',
  },
  {
    name: 'Chronoswap',
    category: ['DEX'],
    description:
      'Chronoswap is one the very first decentralized exchange (DEX) on Cronos Blockchain focused on offering a premier trading experience.',
    logo: 'chronoswap.jpg',
    link: 'https://chronoswap.org',
    twitter: 'https://twitter.com/Chrono_swap',
  },
  {
    name: 'Kafe Finance',
    category: ['Yield'],
    description:
      'KafeFinance is a cross-chain yield optimizer that provides a single platform to auto-compound farms from a variety of projects on MoonRiver and Cronos. KafeFinance has also expanded the platform to include tools such as a portfolio dashboard and zapper.',
    logo: 'kafefinance.png',
    link: 'https://moon.kafe.finance/',
    twitter: 'https://twitter.com/kafefinance',
  },
  {
    name: 'Fortune DAO',
    category: ['Reserve Currency'],
    description:
      'FortuneDAO is the first is a decentralized reserve currency on Cronos network. Using our treasury, we will farm, buy and accumulate native tokens in Cronos. As stated repeatedly, this will help support the Cronos ecosystem and also allows us to become a blackhole for Cronos.',
    logo: 'fortune-dao.png',
    link: 'https://fortunedao.com',
    twitter: 'https://twitter.com/Fortune_DAO',
  },
  {
    name: 'SWAPP',
    category: ['DEX'],
    description:
      'SWAPP Protocol is a decentralized, fairly launched, ETH-paired utility token used to both facilitate yield farming rewards in the Swapp DeFi platform as well as serve as the form of rewards within the Swapp smartphone app (on ios and android).',
    logo: 'swapp.jpg',
    link: 'https://dex.swapp.ee/#/swap',
    twitter: 'https://twitter.com/SwappFi',
  },
  {
    name: 'KryptoDEX',
    category: ['DEX'],
    description:
      'KryptoDEX is powered by InterDeFi with many winning components: a DEX with a very attractive trading fee, a launchpad with great IDO track record, a NFT marketplace, unique 3-type referral system and more.',
    logo: 'kryptodex.jpg',
    link: 'https://kryptodex.org',
    twitter: 'https://twitter.com/KryptoDEX',
  },
  {
    name: 'Agile Finance',
    category: ['Lending'],
    description:
      'Money Markets DeFi platform for lenders and borrowers, that also features own AMM, IDO Launchpad, and NFT Marketplace with Governance AGL token.',
    logo: 'agile-finance.png',
    link: 'https://www.agilefi.org',
    twitter: 'https://twitter.com/agiledefi',
  },
  {
    name: 'Salem Finance',
    category: ['Yield'],
    description: 'Salem Finance is a Yield Farming Protocol.',
    logo: 'salem-finance.png',
    link: 'https://salem.finance/',
    twitter: 'https://twitter.com/SalemFinance',
  },
  {
    name: 'Cronofi Finance',
    category: ['Yield'],
    description: 'Farming on Cronos.',
    logo: 'cronofi-finance.png',
    link: 'https://www.cronofifinance.com/',
    twitter: 'https://twitter.com/Cronofi_Finance',
  },
  {
    name: 'StormSwap',
    category: ['Yield'],
    description:
      'StormSwap is a decentralized yield farming & yield aggegrator protocol powered by Avalanche',
    logo: 'stormswap.png',
    link: 'https://stormswap.finance',
    twitter: 'https://twitter.com/StormSwap_Fi',
  },
  {
    name: 'SmolSwap',
    category: ['DEX'],
    description:
      'SmolSwap is the cutest fair launch decentralised trading platform on the Cronos chain where you can trade and earn in a safe, simple, and fun manner.',
    logo: 'smolswap.jpg',
    link: 'https://smolswap.com',
    twitter: 'https://twitter.com/SmolSwap',
  },
  {
    name: 'DNA Dollar',
    category: ['Stablecoin'],
    description: 'First Algorithmic $USDC pegged Stablecoin in Cronos Network',
    logo: 'dna-dollar.jpg',
    link: 'https://dnadollar.com',
    twitter: 'https://twitter.com/dna_dollar',
  },
  {
    name: 'Cyber Dog',
    category: ['Yield'],
    description:
      'Cyberdog offers features like vaults, incentive pools, NFT marketplace, layers in order to create much more utility to the community.',
    logo: 'cyber-dog.png',
    link: 'https://cyberdog.finance/',
    twitter: 'https://twitter.com/cyberdogdefi',
  },
  {
    name: 'BlackBird Finance',
    category: ['Yield'],
    description:
      'BlackBird Finance, a new Defi protocol powered by Cronos Network to offer exciting features to the Defi community of Cronos to earn better yields and profits.',
    logo: 'blackbird-finance.png',
    link: 'https://croblackbird.finance/',
    twitter: 'https://twitter.com/BlackBirdFIn',
  },
  {
    name: 'Zeus Finance',
    category: ['Yield'],
    description:
      'Zeu$ Finance is a sustainable, decentralized, value-oriented, multi-token ecosystem on the newly born Cronos Network',
    logo: 'zeus-finance.png',
    link: 'https://www.zeusfinance.app/',
    twitter: 'https://twitter.com/ZeusFinanceCro',
  },
  {
    name: 'Genesis Finance',
    category: ['DEX'],
    description:
      'Genesis Finance is the a cross chain yield aggregator that enables users to get great returns on their assets from different yield finance products farms pools vaults and the \'Garden of Eden\' Genesis. Finance’s team is bringing something new on Cronos and our aim is to keep investors funds safe across different chains',
    logo: 'genesis-finance.png',
    link: 'https://genesisfinance.app',
    twitter: 'https://twitter.com/cronos_genesis',
  },
  {
    name: 'VultureSwap',
    category: ['DEX'],
    description:
      'VultureSwap is a DEX on Cronos Chain which offers token swap/trading at the lowest price on the whole Cronos Defi space.',
    logo: 'vultureswap.jpg',
    link: 'https://vultureswap.finance',
    twitter: 'https://twitter.com/VultureSwap',
  },
  {
    name: 'MetaCrono',
    category: ['Yield Aggregator'],
    description: 'MetaCrono is a new yield farming & yield aggregator protocol powered by Cronos.',
    logo: 'metacrono.png',
    link: 'https://www.metacrono.finance/',
    twitter: 'https://twitter.com/MetaCronoFarms',
  },
  {
    name: 'Galatea Cash',
    category: ['Stablecoin'],
    description:
      'Galatea cash is the first algorithmic stablecoin protocol designed to follow the price of CRO running on the Cronos Chain.',
    logo: 'galatea-cash.jpg',
    link: 'https://galatea.cash',
    twitter: 'https://twitter.com/GalateaCash',
  },
  {
    name: 'Croissant Games',
    category: ['Staking'],
    description:
      'Unlike traditional games that operate in black boxes, Croissant Games runs on smart contracts that are fair, transparent, non-custodian, and immutable. Furthermore, we have a proprietary gasless model utilizing EIP-712, meaning that playing any of our games will not require any gas fees from the player\'s end!',
    logo: 'croissant-games.png',
    link: 'https://croissant.games',
    twitter: 'https://twitter.com/GamesCroissant',
  },
];

const unListedProjects: CronosProject[] = [
  {
    name: 'Single Finance',
    category: ['Yield Aggregator'],
    logo: 'single-finance-logo.png',
    description: '',
    link: 'https://app.singlefinance.io/single-click',
    twitter: '',
  },
  {
    name: 'The Gas Station',
    category: ['Staking'],
    logo: 'the-gas-station-logo.png',
    description: '',
    link: 'https://www.gasstationcrypto.com/',
    twitter: '',
  },
  {
    name: 'Bushicro',
    category: ['NFT'],
    logo: 'bushicro-logo.png',
    description: '',
    link: 'https://bushicro.io/',
    twitter: '',
  },
  {
    name: 'Liquidus',
    category: ['Yield Aggregator'],
    logo: 'liquidus.png',
    description: '',
    link: 'https://farm.liquidus.finance/',
    twitter: '',
  },
  {
    name: 'CroSkull',
    category: ['NFT'],
    logo: 'croskull.png',
    description: '',
    link: 'https://app.croskull.com/#/',
    twitter: '',
  },
  {
    name: 'LootPad',
    category: ['NFT'],
    logo: 'lootpad.png',
    description: '',
    link: 'https://lootpad.io/',
    twitter: '',
  },
  {
    name: 'METF Finance',
    category: ['NFT'],
    logo: 'metf-finance.png',
    description: '',
    link: 'https://metf.finance/#/dashboard',
    twitter: '',
  },
  {
    name: 'CronosBay',
    category: ['NFT'],
    link: 'https://www.cronosbay.com/',
    logo: 'cronosbay.png',
    description: '',
    twitter: '',
  },
  {
    name: 'Cougar Exchange',
    category: ['DEX'],
    link: 'https://cgx.finance/',
    logo: 'cougar-exchange.png',
    description: '',
    twitter: '',
  },
  {
    name: 'MMF Money',
    category: ['DEX'],
    link: 'https://mmf.money/',
    logo: 'mmf-money.png',
    description: '',
    twitter: '',
  },
  {
    name: 'VersaGames',
    link: 'https://versagames.io/',
    category: ['Metaverse'],
    logo: 'VersaGames.png',
    description: '',
    twitter: '',
  },
  {
    name: 'DexPad',
    link: 'https://dexpad.io/home',
    category: ['Launchpad'],
    logo: 'DexPad.png',
    description: '',
    twitter: '',
  },
  {
    name: 'TofuNFT',
    link: 'https://tofunft.com/cronos',
    category: ['NFT'],
    logo: 'TofuNFT.png',
    description: '',
    twitter: '',
  },
  {
    name: 'Boomer Squad',
    link: 'https://www.boomersquad.io/',
    category: ['NFT'],
    logo: 'Boomer_Squad.png',
    description: '',
    twitter: '',
  },
  {
    name: 'PegasusDollar',
    link: 'https://pegasusdollar.finance/home',
    category: ['Stablecoin'],
    logo: 'PegasusDollar.png',
    description: '',
    twitter: '',
  },
  {
    name: 'Ferro Protocol',
    link: 'https://ferroprotocol.com/#/',
    category: ['DEX'],
    logo: 'Ferro_Protocol.png',
    description: '',
    twitter: '',
  },
  {
    name: 'Cougar Optimizer',
    link: 'https://cgo.finance/',
    category: ['Yield'],
    logo: 'Cougar_Optimizer.png',
    description: '',
    twitter: '',
  },
  {
    name: 'Argo Finance',
    link: 'https://www.argofinance.money/stake',
    category: ['Staking'],
    logo: 'Argo_Finance.png',
    description: '',
    twitter: '',
  },
  {
    name: 'MarbleVerse',
    link: 'https://www.marbleverse.io/',
    category: ['Metaverse'],
    logo: 'MarbleVerse.png',
    description: '',
    twitter: '',
  },
];

const NFTProjects: CronosProject[] = [
  {
    name: 'Cronos Chimp Club',
    category: ['NFT'],
    description:
      '10,000 uniquely generated Chimps on the Cronos Chain with various traits that celebrate the different aspects of the Cronos ecosystem.',
    logo: 'vjQcypIM_400x400.png',
    link: 'https://cronoschimp.club/',
    twitter: 'https://twitter.com/CronosChimpClub',
  },
  {
    name: 'Crosmonauts',
    category: ['NFT'],
    description:
      'Cronos Crosmonauts is an extremely limited collection of 1000 unique NFT\'s on the Cronos blockchain.',
    logo: 'VNkWg0qu_400x400.png',
    link: 'https://www.crosmonauts.club/',
    twitter: 'https://twitter.com/crosmonaut',
  },
  {
    name: 'Crocos NFT',
    category: ['NFT'],
    description:
      'CrocosNFT is a collection of 2000 Crypto Crocodile NFTs – unique digital collectibles living in their natural habitat; the brand new Cronos Blockchain.',
    logo: '5E1nW_0q_400x400.png',
    link: 'https://crocosnft.com/',
    twitter: 'https://twitter.com/CrocosNFT',
  },
  {
    name: 'Agora',
    category: ['NFT'],
    description: 'Global NFT MarketPlace Powered On Arbitrum and Cronos.',
    logo: 'XcdQvwmw_400x400.png',
    link: 'https://agoracro.com/',
    twitter: 'https://twitter.com/AgoramarketNFT',
  },
  {
    name: 'CRO Crow',
    category: ['NFT'],
    description: 'CRO CROW is the first NFT deployed on Cronos Chain.',
    logo: 'bHEK4pyP_400x400.png',
    link: 'https://crocrow.com/',
    twitter: 'https://twitter.com/cronoscrocrow',
  },
  {
    name: 'CroPunks',
    category: ['NFT'],
    description:
      'CroPunks is a collection of over 1111 punks with unique attributes and styles. Punks are definitely popular with NFT collectors as they are officially 100% sold out',
    logo: 'OzhB0zBV_400x400.png',
    link: 'https://stake.cropunks.art/',
    twitter: 'https://twitter.com/PUNKSONCRONOS',
  },
  {
    name: 'EbisuBay',
    category: ['NFT'],
    description:
      'The first NFT marketplace on Cronos. Create, buy, sell, trade and enjoy the #CroFam NFT community.',
    logo: 'ebisus-bay.png',
    link: 'https://app.ebisusbay.com/',
    twitter: 'https://twitter.com/EbisusBay',
  },
  {
    name: 'Mad Meerkat',
    category: ['NFT'],
    description:
      'Each Genesis Mad Meerkat grants you the absolute ownership of your NFT, and backs you as an entrant to the wholly owned Burrow.',
    logo: 'ATYOILyW_400x400.png',
    link: 'https://madmeerkat.io/',
    twitter: 'https://twitter.com/MadMeerkatNFT',
  },
  {
    name: 'Petite Planets',
    category: ['NFT'],
    description:
      'We\'re creating 10,000 unique and beautiful NFT planets. Based on our solar system and beyond, which will live on the Cronos chain',
    logo: 'Xc1TIhyS_400x400.png',
    link: 'https://petiteplanets.com/',
    twitter: 'https://twitter.com/PetitePlanets',
  },
  {
    name: 'SupBirds',
    category: ['NFT'],
    description:
      'SupBirds are 5000 unique bird characters that live on Cronos Blockchain. Each Sup Bird comes with proof of ownership as a CRO NFT',
    logo: '005bXle3_400x400.png',
    link: 'https://www.supbirds.com/',
    twitter: 'https://twitter.com/SupBirdsNFT',
  },
  {
    name: 'Metaverse Pixels',
    category: ['NFT', 'Metaverse', 'Farm'],
    description:
      'Metaverse pixels is a nft related platform running on CRONOS, is a big grid where you can get pixels from the grid as NFT and submit your own content (image, detail, link), we also have MetaPx Token that is used to get pixels and yield farming',
    logo: 'metaverse-pixels-logo.png',
    link: 'https://www.metaversepixels.app/',
    twitter: 'https://twitter.com/MetaversePixels',
  },
  {
    name: 'Panels Project',
    category: ['NFT'],
    description:
      'Panels Project is an NFT collection that will result in a multiplayer video game and a metaverse integration.',
    logo: 'panels-project-logo.png',
    link: 'https://www.panelsproject.com/',
    twitter: 'https://twitter.com/PanelsProject',
  },
  {
    name: 'CroSea',
    category: ['NFT', 'Launchpad'],
    description:
      'The first open NFT marketplace on Cronos to buy, sell, auction, mint and trade Cronos based NFT.',
    logo: 'crosea-logo.png',
    link: 'https://www.crosea.io/',
    twitter: 'https://twitter.com/croseanft',
  },
  {
    name: 'The Crobees',
    category: ['NFT'],
    description: 'A colony of 2222 crobees invade the cronos chain. Join them and build the hive.',
    logo: 'the-crobees-logo.png',
    link: 'https://www.crobees.com/',
    twitter: 'https://twitter.com/The_Crobees',
  },
  {
    name: 'Reckless Robots NFT',
    category: ['NFT'],
    description:
      'Reckless Robots is a collection of 2100 unique and detailed hand-drawn NFTs deployed on the Cronos Chain. Distinctive features for the project are NFT staking and eliminations (burning). Eliminations are conducted by buying the weakest bids from secondary markets and burning the NFTs. Eliminated NFTs are commemorated in the community.',
    logo: 'reckless-robots-logo.png',
    link: 'https://www.recklessrobotsnft.com',
    twitter: 'https://twitter.com/recklessrobots',
  },
  {
    name: 'Cronos Ragdolls',
    category: ['NFT', 'Metaverse'],
    description:
      'Based on two real-life Ragdoll cats, the Cronos Ragdolls NFT provides utility by building a decentralized metaverse NFT art gallery that adjusts to your Cronos wallet.',
    logo: 'cronos-ragdolls-logo.png',
    link: 'https://www.cronosragdolls.com/',
    twitter: 'https://twitter.com/CronosRagdolls',
  },
  {
    name: 'Cronos Secret Society',
    category: ['NFT', 'Metaverse'],
    description: 'Four Societies, Four Species, One Blockchain!',
    logo: 'cronossociety-logo.png',
    link: 'https://cronossociety.com/',
    twitter: 'https://twitter.com/CronosSociety',
  },
  {
    name: 'Minted',
    category: ['NFT'],
    description: 'Get rewarded for trading NFTs',
    logo: 'minted.png',
    link: 'https://minted.network/',
    twitter: '', 
  }
];

export const projects = [...defillamaProjects, ...unListedProjects, ...NFTProjects];
