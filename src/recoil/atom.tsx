import { atom } from 'recoil';

const walletIdentifierState = atom({
    key: 'walletIdentifier',
    default: '',
});

export {
    walletIdentifierState
}