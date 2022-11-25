import { Web3Provider } from '@ethersproject/providers'

const NETWORK_POLLING_INTERVALS: { [chainId: number]: number } = {
    // [SupportedChainId.ARBITRUM_ONE]: ms`1s`,
  }

export default function getLibrary(provider: any): Web3Provider {
    const library = new Web3Provider(
      provider,
      typeof provider.chainId === 'number'
        ? provider.chainId
        : typeof provider.chainId === 'string'
        ? parseInt(provider.chainId)
        : 'any'
    )
    library.pollingInterval = 1000
    library.detectNetwork().then((network) => {
      const networkPollingInterval = NETWORK_POLLING_INTERVALS[network.chainId]
      if (networkPollingInterval) {
        console.debug('Setting polling interval', networkPollingInterval)
        library.pollingInterval = networkPollingInterval
      }
    })
    return library
  }
  