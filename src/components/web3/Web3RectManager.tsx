import React from 'react'
import { useWeb3React } from '@web3-react/core'
import {useEagerConnect, useInactiveListener} from "../../hooks";
import {Web3Provider} from "@ethersproject/providers";

export default function Web3RectManager({ children }: { children: JSX.Element }) {
    const context = useWeb3React<Web3Provider>()
    const { connector} = context
    const [activatingConnector, setActivatingConnector] = React.useState<any>()

    React.useEffect(() => {
        if (activatingConnector && activatingConnector === connector) {
            setActivatingConnector(undefined)
        }
    }, [activatingConnector, connector])

    const triedEager = useEagerConnect()
    useInactiveListener(!triedEager || !!activatingConnector)

    return  children
}