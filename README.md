# Crypto.com DeFi Desktop Wallet

## Warning
Crypto.com DeFi Desktop Wallet may be subject to change. Before proceeding, please be aware of the following:

- Crypto.com is not liable for any potential damage, loss of data, or files arising from the use of the wallet.

## Latest releases

Please refer to the [release page](https://github.com/crypto-com/chain-desktop-wallet/releases) for the latest released version.

## Contributing
Please abide by the [Code of Conduct](./CODE_OF_CONDUCT.md) in all interactions, and the [contributing guidelines](./CONTRIBUTING.md) when submitting code.

### Multi-Language Content Management
Please refer to the [Instructions on Multi-Language Content Management](./CONTENT_MANAGEMENT.md) for any content updates. 

## License
[Apache 2.0](./LICENSE)

## Manual Build for Development

### Pre-requirements

This project requires [Node.js](https://nodejs.org/) to build, [.node-version](./.node-version) indicates the version currently being used. 

You can either install Node.js globally or use any of the Node Version Manager versions, with respect to [.node-version](./.node-version) in [this list](https://github.com/shadowspawn/node-version-usage).

### Installation

```sh
yarn install
```
Installs all the needed dependencies

### Development & Builds Processes

#### Web Target 🌐

```sh
yarn start
```
The command above runs the app as a normal web app in development, deployed at http://localhost:3000/

```sh
yarn build
```
Builds an optimized web distributable output for the repository.

The final output build should be ready to be deployed like any normal react web app. The `/build` folder is ready to be deployed 🚀


#### Electron Target 💻

```sh
# Use webpack
yarn electron:dev

# Or use Vite(faster)
yarn vite:dev
```
Runs the Electron app in the development mode.

The Electron app will reload if you make edits in the electron directory.
You will also see any lint errors in the console.


```sh
yarn electron:build
```
Builds the Electron app package for production to the dist folder.

The app is ready to be distributed!
