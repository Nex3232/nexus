import { useMemo } from 'react'
import { useWeb3React } from '@web3-react/core';
import { getAddress } from '@ethersproject/address'
import { Web3Provider, JsonRpcSigner, TransactionReceipt } from '@ethersproject/providers';
import { AddressZero } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import ERC20_ABI from '../abis/erc20.json'
import FACE_ABI from '../abis/Face.json'
import Pool_ABI from '../abis/pool.json'
export function isAddress(value: any): string | false {
    try {
        return getAddress(value)
    } catch {
        return false
    }
}

function getSigner(library: Web3Provider, account: string): JsonRpcSigner {

    return library.getSigner(account).connectUnchecked()
}

function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
    return account ? getSigner(library, account) : library
}

function getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
    if (!isAddress(address) || address === AddressZero) {
        let msg = address == undefined ? "undefined" : address;
        throw Error(`Invalid address parameter '${msg}'.`)
    }
    return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}

export function useContract<T extends Contract = Contract>(
    addressOrAddressMap: string | { [chainId: number]: string } | undefined,
    ABI: any,
    withSignerIfPossible = true
): T | null {
    const { library, account, chainId } = useWeb3React()
    return useMemo(() => {
        if (!addressOrAddressMap || !ABI || !library || !chainId) return null
        let address: string | undefined
        if (typeof addressOrAddressMap === 'string') address = addressOrAddressMap
        else address = addressOrAddressMap[chainId]
        if (!address) {
            return null
        }

        try {
            return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
        } catch (error) {
            console.error('Failed to get contract', error)
            return null
        }
    }, [addressOrAddressMap, ABI, library, chainId, withSignerIfPossible, account]) as T
}

export function useERC20(tokenAddress: string) {
    return useContract(tokenAddress, ERC20_ABI);
}

export function useFace(tokenAddress: string) {
    return useContract(tokenAddress, FACE_ABI);
}

export function usePool(tokenAddress: string) {
    return useContract(tokenAddress, Pool_ABI);
}

