import { InjectedConnector } from '@web3-react/injected-connector'

export const injected = new InjectedConnector({
    supportedChainIds: [1, 3, 10, 11, 42, 15, 97, 56],
})

export const enum SUPPORT_CHAINIDS {
    MAINNET = 1,
    ROPSTEN = 3,
    RINKEBY = 4,
    GOERLI = 5,
    KOVAN = 42,
    DEV = 15,
    BSC_TEST = 97,
    BSC_MAINNET = 56,
};

export const MAX_UNIT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
