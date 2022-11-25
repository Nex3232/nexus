import React from 'react'
declare const window: any

export default function Web3NetworkProvider({ children }: { children: JSX.Element }) {
  React.useEffect(() => {
    window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: process.env.REACT_APP_NET_CHAIN_ID }] })
      .then(() => {
        if (window.ethereum) {
          console.log("switch chain", process.env.REACT_APP_NET_CHAIN_ID, new Date())
        } else {
          alert('Please confirm that you have installed the Metamask wallet.');
        }
      })
      .catch((error: Error) => {
        const params = [{
          chainId: process.env.REACT_APP_NET_CHAIN_ID,
          chainName: process.env.REACT_APP_Net_Name,
          nativeCurrency: {
            name: process.env.REACT_APP_NET_SYMBOL,
            symbol: process.env.REACT_APP_NET_SYMBOL,
            decimals: 18
          },
          rpcUrls: [process.env.REACT_APP_NET_URL],
          blockExplorerUrls: [process.env.REACT_APP_NET_SCAN]
        }];
        window.ethereum.request({ method: 'wallet_addEthereumChain', params })
          .then(() => {
            if (window.ethereum) {
              console.log("add chain", process.env.REACT_APP_NET_CHAIN_ID)
            } else {
              alert('Please confirm that you have installed the Metamask wallet.');
            }
          }).catch((error: Error) => console.log("Error", error.message))
      })
  }, [])

  return children
}