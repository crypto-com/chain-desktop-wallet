### Chain Desktop Wallet

Crypto.com chain desktop wallet

### Development and builds process

```
yarn install
```
Installs all the needed dependencies

```
yarn electron:dev
```
Runs the Electron app in the development mode.

The Electron app will reload if you make edits in the electron directory.
You will also see any lint errors in the console.


```
yarn electron:build
```
Builds the Electron app package for production to the dist folder.

The app is ready to be distributed!