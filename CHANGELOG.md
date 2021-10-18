# Changelog

All notable changes to this project will be documented in this file.

*Unreleased*

*Released*

## [v0.5.1] - 2021-10-18

### Additions
- Enhancements on the staking view and capabilities.
- Add Ledger support for CRONOS.
- Add initial Bridge functionality : Cronos <> Crypto.org.
- Added disclaimer notices and warning on non-supported regions.

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

- This wallet is only testnet-ready, do not use in mainnet.
- Do not transfer any ERC20 tokens to addresses generated by this sample code as it can cause loss of funds.
- Crypto.com is not liable for any potential damage, loss of data/files arising from the use of the wallet.
