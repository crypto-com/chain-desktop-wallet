# Changelog

All notable changes to this project will be documented in this file.

*Unreleased*

*Released*
## [v1.3.0] - 2022-08-24
### Additions
- Ethereum Chain Support
- Cosmos Hub ATOM Support
- Bridge Transfer supports between Cronos Chain and Cosmos Hub
- DApps Browser EVM chain switching capability
- WalletConnect connection capability
- Token Price Chart
- Notification Center
## [v1.2.0] - 2022-07-25
### Additions
- Governance Proposal Submission
- Deposit to Governance Proposal
- Customer Service Live Support
### Bug fixes
- Inaccurate Voting History
## [v1.1.1] - 2022-07-15
### Bug fixes
- Clean up duplicated rewards, delegations 
- Incorrect display of Mainnet Cronos NFT transfer history for Testnet wallet
## [v1.1.0] - 2022-07-11
### Additions
- View Governance Voting History
- Allow DApp Browser localhost access for development use
- Security enhancement with Electron package bump
- Update Cronos DApps list
### Bug fixes
- Google search engine in URL search bar
## [v1.0.0] - 2022-06-21
### Additions
- Batch restake rewards
- Rebranded as Crypto.com DeFi Desktop Wallet
### Bug fixes
- App crashes in URL search bar
- Occasional incorrect reward list
## [v0.8.1] - 2022-05-30
### Bug fixes
- Token Approval request failure
## [v0.8.0] - 2022-05-27
### Additions
- Enforce better password protection on transactions
### Bug fixes
- Gas Fee validation on invalid values
## [v0.7.9] - 2022-05-20
### Additions
- Revoke Token Permission
- Batch withdraw rewards
## [v0.7.8] - 2022-05-13
### Bug fixes
- Handle Ledger Live standard support on EVM transaction signing functions
- Incorrect Transaction Failed popup on Testnet due to delayed transaction receipt return
- UX optimization
## [v0.7.7] - 2022-05-10
### Additions
- Gas Fee option customization panel
- Ledger Wallet creation UX enhancement
- Support Ledger Live Derivation Path standard
### Bug fixes
- Stablize Market Price fetching
## [v0.7.6] - 2022-04-20
### Bug fixes
- Measures on preventing potential Phishing Attack on DApp Browser
## [v0.7.5] - 2022-04-14
### Additions
- Cronos NFT support
- Password protection on Address Book
### Bug fixes
- Restart & purge local storage automatically after 10 incorrect password attempts
## [v0.7.4] - 2022-03-25
### Additions
- Duration selection for Auto Update disable
### Bug fixes
- Some CRC20 token price don't show properly
- App crash when sending tokens with market price not available
- Unable to withdraw Staking Rewards when validators > 10
- Dead DApp list urls
- Incorrect token settings during first time setup
## [v0.7.3] - 2022-03-22
### Additions
- Tooltip for different Asset Types
- Opt-in Auto Update
- Update DApp list 
### Bug fixes
- Incorrect market price for some CRC20 tokens
- Confirmation loop with Ledger in Bridge Transfer
- Missing category filter in DApp List
## [v0.7.2] - 2022-02-24
### Additions
- DApp List fetch from api.llama.fi
- DApp List sorted by TVL in default
### Bug fixes
- Remove non-DApp projects in DApp List
## [v0.7.1] - 2022-02-23
### Additions
- DApps Analytics
### Bug fixes
- DApps Ranking pictures not loaded
- Incorrect Rpc URL
- Security fix on dyld loading
## [v0.7.0] - 2022-02-21
### Additions
- DApps Ranking
- Cronos Rebranding
### Bug fixes
- UI bug on Redelegate & Undelegate funds
## [v0.6.9] - 2022-02-16
### Bug fixes
- Ledger connectivity on Windows
## [v0.6.8] - 2022-02-11
### Additions
- Wrapped ETH NFT support on Crypto.org chain
- Add NFT attributes display support
### Bug fixes
- Missing Ledger sign methods support
- Fix potential app crash in Wallet Page
- Align NFT minting metadata

## [v0.6.7] - 2022-01-28
### Bug fixes
- Incorrect delegation items
- Missing address index on Standard Wallets
- Remove unwanted Ledger notification popup on Standard Wallets

## [v0.6.6] - 2022-01-26
### Additions
- Full DApp Browser Support on Cronos
- Ledger Support in DApp Browser
- UX flow improvement on Ledger Support
- Restake rewards button
- Search function in Validator List

### Bug fixes
- Add loading spin in Staking table list

## [v0.6.5] - 2022-01-19
### Bug fixes
- NFT transaction list sorted by time
- Bridge transaction list sorted by time
- Repeated records in NFT transaction list when switching page
- Incorrect Explorer URL after settings update on Cronos Assets
- Remove CRC721 token from Assets List

## [v0.6.4] - 2022-01-13
### Additions
- Tectonic Support
- CRC20 token whitelisting
- Message Type support in transaction history for `Crypto.org chain` asset
- Revamp Transaction History Records data types
- Adjust Validator list ordering to better promote validators with Up Time >99.9% yet low Voting Power
- Updated App Icon

### Bug fixes
- Fix showing of finished unbonding delegation
- Fix missing of vesting account support

## [v0.6.3] - 2021-12-23
### Bug fixes
- Hide misleading transaction fee on CRC20 tokens

## [v0.6.2] - 2021-12-23
### Bug fixes
- Fix irresponsive transactions when insufficient balance for fee on DApp Browser
- Fix balance not updated after transactions are made on DApp Browser

## [v0.6.1] - 2021-12-21
### Bug fixes
- Sync Cronos settings on all CRC20 tokens
- Fix clear storage failure
- Fix DApp Browser support on Windows
- Fix TokenApproval & SendTransaction issue on DApp Browser

## [v0.6.0] - 2021-12-15

### Additions
- Add CRC20 Tokens support
- Add DApp Browser support on VVS Finance

## [v0.5.8] - 2021-12-07

### Additions
- Adapt to Christmas app icon
- Add memo field support in Address Book
- Add Address Book support in custom destination address on Cronos Bridge
- Update dependencies to stable versions

### Bug fixes
- Update deprecated balance retrieval endpoint for Crypto.org Mainnet upgrade

## [v0.5.7] - 2021-12-02

### Bug fixes
- Fix missing custom destination address support for Ledger wallets on Cronos Bridge
- Extend IBC Transfer timeout to 1 hour

## [v0.5.6] - 2021-11-23

### Additions
- Align on Chain namings
- CRC20 data support

### Bug fixes
- Added missing bridge history records for custom destination addresses
- Fixed validator list auto-filling in redelegate form

## [v0.5.5] - 2021-11-17

### Additions
- Address Book feature
- Add APY & Uptime field in Validator List
- Add Custom Destination Address field for Cronos Bridge

### Bug fixes
- Lengthen Cronos Bridge IBC Transfer timeout from 60 seconds to 10 minutes
- Fixed incorrect delegation list fetching when no active delegations
- Fixed typo & UI

## [v0.5.4] - 2021-11-09

### Bug fixes
- Fixed Cronos Bridge page crashes when Cronos asset is not enabled yet

## [v0.5.3] - 2021-11-08

### Additions
- Increase Password complexity requirement to "Good"
- Update default mainnet Bridge Transfer config

### Bug fixes
- Fixed transfer failure for big amount (e.g. > 100M CRO)
- Fixed missing default memo in asset transfer
- Fixed generate-i18n command failure
- Update Testnet unbonding days change to 28 Days

## [v0.5.2] - 2021-10-28

### Additions
- Add 25%, 50%, 75%, ALL option in Bridge Transfer
- Total Balance includes all assets in fiat amount
- Add avoid quitting mechanism during Bridge Transfer
- Add potential scammer validator warnings

### Bug fixes
- Fixed various layout issues on Asset, Bridge & Staking Page
- Fixed App Crash issue when config settings updated
- Fixed failure bridge transactions for transferring amount's decimal > 4
- Fixed CRONOS transaction with memo failure
- Fixed bridge config not updated successfully
- Enforce strict http/https protocol in indexing URL settings

## [v0.5.1] - 2021-10-18

### Additions
- Enhancements on the staking view and capabilities.
- Add Ledger support for CRONOS.
- Add initial Bridge functionality : Cronos <> Crypto.org.
- Added disclaimer notices and warning on non-supported regions.
- One-click lock screen support.

## [v0.5.0] - 2021-09-03

### Additions
- Multi-Assets support added to the wallet
- EVM building blocks and CRONOS testnet support
- Multiple fiat currency conversion integration
- Support for Croeseid Testnet v4  
- Validator selection : UX update to reduce concentration of liquidity to  a few validators


## [v0.4.2] - 2021-08-03
- QA fixes on missing translations strings
- Fix sorting ordering for translated strings

## [v0.4.1] - 2021-07-27
- Void release to test auto updater on Windows systems

## [v0.4.0] - 2021-07-27

### Additions
- Added support for auto updater on Windows
- Initial support for internationalization and language support.
- Remove obsolete croeseid v2 network configuration


## [v0.3.9] - 2021-07-26

- Add support for seed phrase export to the wallet
- Update dependencies to secure versions

## [v0.3.8] - 2021-07-15

- Add support for seed phrase export to the wallet
- Update dependencies to secure versions

## [v0.3.7] - 2021-07-8

- Remove previous implicit automatic quit and update after update download
- Add optional "Restart Now" button after update download

## [v0.3.6] - 2021-07-8

- Minor cleanup after testing auto updater in closed track release


## [v0.3.5] - 2021-07-8

- [AutoUpdater] Empty sample release to test if v0.3.4 can detect new versions available and update them accordingly


## [v0.3.4] - 2021-07-8

- Sample test release for auto updater feature implementation
- Note that this release won't be published, it will stay as draft for testing
- The sole purpose of this release is to investigate if a signed binary would behave as expected with the auto-updater

## [v0.3.3] - 2021-07-6

- Fixed small layout issues on wallet creation page

## [v0.3.2] - 2021-07-5

- Sample release to test auto updater during development

## [v0.3.1] - 2021-07-5

### Bug Fixes
- Fix issue when using drag and drop for uploads.


## [v0.3.0] - 2021-06-30

### Additions
- NFT support - all basic features now completed : View NFTs, Send NFTs, Mint NFTs
- Introduced capability to mint NFTs directly from the desktop wallet
- Add implicit denom issuance when minting NFTs with a new denom that does not exist yet.


### Bug Fixes
- Add bytes padding for signing related issues on some Ledger devices


## [v0.2.4] - 2021-06-22

### Bug Fixes
- Add bytes padding for signing related issues on some Ledger devices

## [v0.2.3] - 2021-06-17

### Additions
- Implemented search for the wallet list view
- Added support for croeseid testnet version 3
- Fix governance votes tally numbers  
- Add a new NFT UI tab and NFT section on the home screen 
- Load, persist in the DB, and show to the UI all current accounts NFTs
- Add support to send and receive NFTs: Sign and broadcast NFT transactions
- Add capability to load the previous account NFT related transaction history: Send, Receive, Mint, Issue, etc, ...

## [v0.2.2] - 2021-05-24

### Additions
- Added data analytics
- Show validator list view on redelegation flow
- Updated dependencies to secure versions.

## [v0.2.1] - 2021-04-28

### Additions
- Proper sorting on wallets list
- Avoid transactions fetching to fail if wallet receives an IBC asset
- Replace opaque loading spinner when loading wallet info

## [v0.2.0] - 2021-04-17

### Additions
- Governance support added to the desktop wallet app
- Supporting all proposal types listing and grouping 
- Support vote broadcasting on current selected proposal

## [v0.1.6] - 2021-04-14

### Additions
- Added capability to sort wallets by wallet names and wallet types
- General configuration capability now supported - Now possible to propagate changes to all wallets of a certain type
- Ledger, remove 100 wallets index limit - Now up to 2147483647 wallets indexes supported
  
### Bug Fixes
- Fix Ledger disconnection issues

## [v0.1.5] - 2021-04-08

### Additions
- Allow up to 100 wallets creations
- Show reward amounts in fiat currency conversion (USD)
- Remove requirements of wallets confirmation on Ledger based wallets

### Bug Fixes
- On Settings page, when clicking discard changes/restore unsaved changes, 
  network fee and gasLimit changes are now discarded back to previous state

## [v0.1.4] - 2021-04-02

### Bug Fixes
- Load correct top validator set data - Avoid loading inactive validators
- Handle cases where the prices were not loaded from the market API

### Additions
- Load up to 100 active and bonded validators

## [v0.1.3] - 2021-04-01

### Additions
- A newly revamped validator pop up screen selection
- Now loading up to 20 top validators for selection
- Show assets values in USD price on home screen
- Show more informative notice on redelegate confirmations
- Append default client desktop memo when no memo is provided

### Bug Fixes
- Removed the extra text and space that was being added when address is copied
- Fixed misleading warning before wallet deletion for Ledger wallets

## [v0.1.2] - 2021-03-29

### Bug Fixes
- Fix transaction failures on Ledger custom index wallet creations
- Remove MacOS zip binary from release builds which was not being signed

### Additions
- Show detailed error messages on all transaction failure types
- Present up to 8 decimals places for extra-small numbers amounts in transaction views
- Add a physical refresh button for loading and syncing the latest transactions and balance states

## [v0.1.1] - 2021-03-25

### Bug Fixes
- Fix blank screens issues on older databases
- Fetch a new validator set to the store on wallet change event


## [v0.1.0] - 2021-03-24

### Additions
- First release with mainnet configuration support
- Added capability to customize gas limit and network fee on transactions
- Introduced a capability to specify address index for Ledger wallet creations
- Added support for re-delegation in the wallet

## [v0.0.25] - 2021-03-12

### Bug Fixes
- Updated dependency vulnerability issue on react-dev-util

### Additions
- More integration tests

## [v0.0.24] - 2021-03-04

### Bug Fixes

- Fixed an issue that could block wallet creation with Ledger devices

## [v0.0.23] - 2021-03-01

### Bug Fixes

- Fixed an issue that could cause the application crashed on Mac OS

## [v0.0.22] - 2021-02-17

### Added Features

- Added support for Ledger based wallet on creation
- Introduced initial support for undelegation transactions, for both normal wallets and Ledger wallets

## [v0.0.21] - 2021-02-10

### Added Features

- Provide staking validators option for users when trying to delegate funds

## [v0.0.20] - 2021-02-08

### Added Features

- Good handling of maximum transfer or staking transactions
- Show user the fee that is being deducted on the transaction
- Present UI/UX tag of the transaction status in the transfer transaction listing

### Security Fixes & Improvements

- Replace previous pre-encryption disk persistence by temporary memory state that's flushed later on

## [v0.0.13] - 2021-01-07

### Added Features

- The capability to modify current wallet node configurations were added (NodeURL and ChainID)
- Make address validation checks stricter on transfer, prevent input of wrong validator address

### Changed Behaviours
- Hiding devtools tab on production builds and only show it on dev mode

### Known Limitation

- Do not transfer any ERC20 tokens to addresses generated by this sample code as it can cause loss of funds.
- Crypto.com is not liable for any potential damage, loss of data/files arising from the use of the wallet.
