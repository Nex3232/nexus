import { useEffect, useState } from 'react';
import { isAddress, useERC20, useFace, usePool } from '../../hooks/useContract';
import { useWeb3React } from '@web3-react/core';
import { ethers } from "ethers"
import { Button, Col, Row, Statistic, Modal, Input, message, Rate } from 'antd';
import { formatString, fromValue, toValue, verify } from '../../utils/formatting';
import BigNumber from "bignumber.js";
import { MAX_UNIT256 } from '../../constants';
import { AddressZero } from '@ethersproject/constants'
import { iconCode, iconRecharge, iconRecharge1, iconScanCode } from '../../image';
import QRCode from 'qrcode.react';
import loadingStore from '../../state';
import { useTranslation } from 'react-i18next';
import './index.css';

const tp = require('tp-js-sdk')

declare const window: Window & { ethereum: any, web3: any };

const TOKENADDR = process.env.REACT_APP_TOKEN + "";
const USDTADDR = process.env.REACT_APP_TOKEN_USDT + "";
const CONTRACTADDR = process.env.REACT_APP_CONTRACT + "";
export default function Home({ }) {
    const { ethereum } = window as any
    const { account, library } = useWeb3React();
    const { t } = useTranslation()

    const tokenContract = useERC20(TOKENADDR);
    const usdtContract = useERC20(USDTADDR);
    const faceContract = useFace(CONTRACTADDR);
    const poolContract = usePool(TOKENADDR);

    const [isApprove, setIsApprove] = useState<boolean>(false);
    const [isUsdtApprove, setIsUsdtApprove] = useState<boolean>(false);
    const [balance0, setBalance0] = useState<string>('0');
    const [balance1, setBalance1] = useState<string>('0');
    const [totalAmount, setTotalAmount] = useState<string>('0');
    const [returnedAmount, setReturnedAmount] = useState<string>('0');
    const [inviteProfit, setInviteProfit] = useState<string>('0');
    const [vip, setVip] = useState<string>('0');
    const [vipProfit, setVipProfit] = useState<string>('0');

    const [score, setScore] = useState<string>('0');
    const [maxScore, setMaxScore] = useState<string>('0');
    const [selfScore, setSelfScore] = useState<string>('0');
    const [inviter, setInviter] = useState<string>('');
    const [isInviter, setIsInviter] = useState<boolean>(false);
    const [userAddr, setUserAddr] = useState<string>('');
    const [rechargeAmount, setRechargeAmount] = useState<string>('');
    const [rechargeModal, setRechargeModal] = useState<boolean>(false);
    const [codeModal, setCodeModal] = useState<boolean>(false);

    useEffect(() => {
        getAccounts()
    })

    const getAccounts = async () => {
        if (typeof ethereum !== 'undefined') {
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            console.log("getAccounts", accounts)
        } else {
            // tell the user to install an `ethereum` provider extension
        }
    }

    useEffect(() => {
        getAllowance()
        init();
    })

    const init = () => {
        getUsers();
        getBalanceOf();
    }

    const getAllowance = () => {
        tokenContract?.allowance(account, CONTRACTADDR).then((res: any) => {
            if (res.toString() == "0") {
                setIsApprove(false)
            } else {
                setIsApprove(true)
            }
        }).catch((err: any) => {
            setIsApprove(false)
            console.log("getAllowance err", err)
        })

        usdtContract?.allowance(account, TOKENADDR).then((res: any) => {
            if (res.toString() == "0") {
                setIsUsdtApprove(false)
            } else {
                setIsUsdtApprove(true)
            }
        }).catch((err: any) => {
            setIsUsdtApprove(false)
            console.log("getAllowance err", err)
        })
    }

    const getUsers = () => {
        faceContract?.users(account).then((res: any) => {
            if (res.inviter === AddressZero) {
                setIsInviter(false)
            } else {
                setInviter(res.inviter)
                setIsInviter(true)
            }
            setVip(res.vip.toString())
            setScore(res.score.toString())
            setTotalAmount(res.totalAmount.toString())
            setReturnedAmount(res.returnedAmount.toString())
            setInviteProfit(res.inviteProfit.toString())
            setVipProfit(res.vipProfit.toString())
            faceContract?.users(res.maxScoreUser).then((ret: any) => {
                setMaxScore(ret.score.toString())
                setSelfScore(ret.selfScore.toString())

            }).catch((err: any) => {
                console.log("getUsers maxScoreUser", err)
            })

        }).catch((err: any) => {
            console.log("getUsers", err)
        })
    }

    const getBalanceOf = () => {
        faceContract?.balanceOf(account).then((res: any) => {
            setBalance0(res[0].toString())
            setBalance1(res[1].toString())
        }).catch((err: any) => {
            setBalance0("0")
            setBalance1("0")
        })
    }

    const sendDeposit = () => {
        if (!isAddress(inviter) || inviter === AddressZero) {
            message.error(`${t("correctAddress")}`)
            return
        }

        if (!isAddress(userAddr) || userAddr === AddressZero) {
            message.error(`${t("correctAddress")}`)
            return
        }

        let tokenValue = toValue(rechargeAmount);

        loadingStore.changeLoad(`${t("Loading")}`, true, "loading");
        faceContract?.estimateGas.deposit(inviter, userAddr, tokenValue, { from: account }).then((gas: any) => {
            faceContract?.deposit(inviter, userAddr, tokenValue, { from: account, gasLimit: gas.mul(120).div(100) })
                .then((response: any) => {
                    if (response && response.hash) {
                        TransactionReceipt(response.hash, 0)
                    } else {
                        loadingStore.changeLoad(`${t("transactionfailed")}`, true, "error");
                    }
                }).catch((error: any) => {
                    console.log(" error=", error)
                    loadingStore.changeLoad(`${t("transactionfailed")}`, true, "error");
                });
        }).catch((error: any) => {
            loadingStore.changeLoad(`${t("transactionfailed")}`, true, "error");
            console.log("gas error=", error)
        });
    }

    const sendSettle = () => {
        loadingStore.changeLoad(`${t("Loading")}`, true, "loading");
        faceContract?.estimateGas.settle(account, { from: account }).then((gas: any) => {
            faceContract?.settle(account, { from: account, gasLimit: gas.mul(120).div(100) })
                .then((response: any) => {
                    console.log("response", response)
                    if (response && response.hash) {
                        TransactionReceipt(response.hash)
                    } else {
                        loadingStore.changeLoad(`${t("transactionfailed")}`, true, "error");
                    }
                }).catch((error: any) => {
                    console.log(" error=", error)
                    loadingStore.changeLoad(`${t("transactionfailed")}`, true, "error");
                });
        }).catch((error: any) => {
            loadingStore.changeLoad(`${t("transactionfailed")}`, true, "error");
            console.log("gas error=", error)
        });
    }

    const sendApprove = () => {
        // setApproveLoading(true);
        loadingStore.changeLoad(`${t("Loading")}`, true, "loading");
        tokenContract?.estimateGas.approve(CONTRACTADDR, MAX_UNIT256, { from: account }).then((gas: any) => {
            tokenContract?.approve(CONTRACTADDR, MAX_UNIT256, { from: account, gasLimit: gas.mul(110).div(100) })
                .then((response: any) => {
                    console.log("response", response)
                    if (response && response.hash) {
                        TransactionReceipt(response.hash, 1)
                    } else {
                        loadingStore.changeLoad(`${t("Authorizationfailed")}`, true, "error");
                    }
                }).catch((error: any) => {
                    setIsApprove(false)
                    loadingStore.changeLoad(`${t("Authorizationfailed")}`, true, "error");
                });
        }).catch((error: any) => {
            loadingStore.changeLoad(`${t("Authorizationfailed")}`, true, "error");
        });
    }

    const TransactionReceipt = (hash: any, type?: number) => {
        var interval = setInterval(() => {
            let provider = new ethers.providers.Web3Provider(library.provider);
            provider.getTransactionReceipt(hash).then((receipt: any) => {
                console.log(receipt, "providers");
                if (receipt != null) {
                    clearInterval(interval);
                    setTimeout(() => {
                        if (type == 0) {
                            loadingStore.changeLoad(`${t("successfultransaction")}`, true, "success");
                            closeModal()
                            init()
                        } else if (type == 1) {
                            loadingStore.changeLoad(`${t("Authorizationsuccessful")}`, true, "success");
                            setIsApprove(true)
                        } else if (type == 2) {
                            loadingStore.changeLoad(`${t("Authorizationsuccessful")}`, true, "success");
                            setIsUsdtApprove(true)
                        } else {
                            loadingStore.changeLoad(`${t("successfultransaction")}`, true, "success");
                            init()
                        }
                    }, 1000);
                }
            });
        }, 3000);
    }

    const closeModal = () => {
        setUserAddr("");
        setRechargeAmount('');
        setRechargeModal(false);
    }

    const connectWallet = () => {
        window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: process.env.REACT_APP_NET_CHAIN_ID + "" }] })
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
                        decimals: process.env.REACT_APP_NET_DECIMALS
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
    }

    return (
        <div className='mainContent'>
            <div className=" main">
                <div className="home">
                    <div className='card card-shadow-gray' style={{
                        background: "#fff",
                        color: "#000",
                        marginTop: "20px"
                    }}>
                        <Row >
                            <Col >
                                <p style={{
                                    lineHeight: "35px",
                                    fontSize: "16px",
                                    fontWeight: "bold"
                                }}>
                                    {
                                        account ? <span>
                                            {formatString(account, 8)}

                                        </span> : <span onClick={() => {
                                            connectWallet()
                                        }}>{t("connectwallet")}</span>
                                    }
                                </p>
                            </Col>
                            <Col flex={1} style={{
                                textAlign: "right"
                            }}>
                                <Modal title={`${t("ShareQRcode")}`}
                                    open={codeModal}
                                    onCancel={() => {
                                        setCodeModal(false)
                                    }}
                                    footer={null}
                                >
                                    <div>
                                        <Row className='textcenter'>
                                            <QRCode
                                                id='code'
                                                style={{
                                                    margin: "0 auto"
                                                }}
                                                value={account + ""}
                                                size={200}
                                                fgColor="#000000"
                                            />
                                        </Row>
                                    </div>
                                </Modal>
                                <img src={iconCode} alt="" onClick={() => {
                                    setCodeModal(true)
                                }} />
                            </Col>
                        </Row>
                        <Row className='texthight'>
                            <Col flex={"50px"}>{t("Amount")}:</Col>
                            <Col>
                                <Statistic valueStyle={{
                                    color: '#f28703',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }} value={fromValue(balance0)} precision={2} />
                            </Col>
                            <Col flex={"20px"} style={{ textAlign: "center"}}>+</Col>
                            <Col >
                                <Statistic valueStyle={{
                                    color: '#f28703',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }} value={fromValue(balance1)} precision={2} />
                            </Col>
                        </Row>
                        <Row className='textcenter'>
                            <Col flex={"1"} style={{
                                textAlign: "center",
                                paddingBottom: "10px",
                            }}>
                                <Rate disabled defaultValue={Number(vip)} />
                            </Col>
                        </Row>
                        <Row className='textcenter'>
                            <Modal title={`${t("Recharge")}`}
                                open={rechargeModal}
                                onCancel={() => {
                                    closeModal()
                                }}
                                footer={null}
                            >
                                <div>
                                    <Row className='texthight'>
                                        <Col span={24}>
                                            <p> {t("Recommendedaddress")}:</p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            {
                                                isInviter ? <Input value={inviter} disabled /> : <div style={{
                                                    display: "flex"
                                                }}>
                                                    <Input value={inviter} onChange={(e) => {
                                                        setInviter(e.target.value)
                                                    }} />

                                                    <img src={iconScanCode} onClick={() => {
                                                        tp.invokeQRScanner().then((res: any) => {
                                                            setInviter(res)
                                                        })
                                                    }} alt="" />
                                                </div>
                                            }
                                        </Col>
                                    </Row>

                                    <Row className='texthight'>
                                        <Col span={24}>
                                            <p> {t("useraddress")}:</p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <div style={{
                                                display: "flex"
                                            }}>
                                                <Input value={userAddr} onChange={(e) => {
                                                    setUserAddr(e.target.value)
                                                }} />
                                                <img src={iconScanCode} onClick={() => {
                                                    tp.invokeQRScanner().then((res: any) => {  setUserAddr(res) })
                                                }} alt="" />
                                            </div>

                                        </Col>
                                    </Row>
                                    <Row className='texthight'>
                                        <Col span={24}>
                                            <p>{t("Rechargeamount")}:</p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <Input value={rechargeAmount} onChange={(e) => {
                                                let value = e.target.value;
                                                setRechargeAmount(verify(value));
                                            }} />
                                        </Col>
                                    </Row>

                                    <Row className='textcenter' style={{
                                        marginTop: "10px"
                                    }}>
                                        <Col flex={1}>
                                            <Button type="primary" onClick={() => {
                                                closeModal()
                                            }}>{t("Cancel")}</Button>
                                        </Col>
                                        <Col flex={1}>
                                            {
                                                isApprove ? <Button type="primary" onClick={() => {
                                                    sendDeposit()
                                                }}>{t("Recharge")}</Button> : <Button type="primary" onClick={() => {
                                                    sendApprove()
                                                }}>{t("Approve")}</Button>
                                            }
                                        </Col>
                                    </Row>
                                </div>
                            </Modal>

                            <Col flex={1}>
                                <Button type="primary" onClick={() => {
                                    setRechargeModal(true);
                                }}>{t("Recharge")}</Button>
                            </Col>
                            <Col flex={1}>
                                {
                                    new BigNumber(balance0).plus(balance1).isGreaterThan(0) ? <Button type="primary" onClick={() => {
                                        sendSettle()
                                    }}> {t("withdraw")}</Button> : <Button type="primary" disabled>{t("withdraw")}</Button>
                                }
                            </Col>
                        </Row>
                    </div>

                    <div className='card card-shadow-gray'>
                        <Row>
                            <Col span={24} className='card-box'>
                                <img src={iconRecharge1} alt="" />
                                <p>
                                    {t("achievement")}
                                </p>
                            </Col>
                        </Row>
                        <Row className='textcenter'>
                            <Col flex={1}>
                                <p> {t("shouldbereturned")}</p>
                                <Statistic valueStyle={{
                                    color: '#f28703',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }} value={fromValue(totalAmount)} precision={2} />
                            </Col>
                            <Col flex={1}>
                                <p> {t("returned")}</p>
                                <Statistic valueStyle={{
                                    color: '#f28703',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }} value={fromValue(new BigNumber(returnedAmount).plus(balance0).toFixed())} precision={2} />
                            </Col>
                        </Row>
                        <Row className='textcenter'>
                            <Col flex={1}>
                                <p> {t("Regionalperformance")}</p>
                                <Statistic valueStyle={{
                                    color: '#f28703',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }} value={fromValue(new BigNumber(new BigNumber(maxScore).plus(selfScore).toString()).toFixed())} precision={2} />
                            </Col>
                            <Col flex={1}>
                                <p>{t("Otherachievements")}</p>
                                <Statistic valueStyle={{
                                    color: '#f28703',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }}  value={fromValue(new BigNumber(score).toFixed())} precision={2} />
                            </Col>
                        </Row>
                    </div>

                    {/* <div className='card card-shadow-origin'> */}
                    <div className='card card-shadow-gray'>
                        <Row>
                            <Col span={24} className='card-box'>
                                <img src={iconRecharge} alt="" />
                                <p>
                                    {t("income")}
                                </p>
                            </Col>
                        </Row>
                        <Row className='texthight'>
                            <Col>
                                <p>{t("staticincome")}:</p>
                            </Col>
                            <Col flex={"auto"}>
                                <Statistic valueStyle={{
                                    color: '#f28703',
                                    fontSize: "22px",
                                    fontWeight: "400",
                                    paddingLeft: "10px"
                                }} value={fromValue(new BigNumber(returnedAmount).plus(balance0).toFixed())} precision={2} />

                            </Col>
                        </Row>
                        <Row className='texthight'>
                            <Col>
                                <p>{t("Referralincome")}:</p>
                            </Col>
                            <Col flex={"auto"}>
                                <Statistic valueStyle={{
                                    color: '#f28703',
                                    fontSize: "22px",
                                    fontWeight: "400",
                                    paddingLeft: "10px"
                                }} value={fromValue(inviteProfit)} precision={2} />
                            </Col>
                        </Row>
                        <Row className='texthight'>
                            <Col>
                                <p>{t("Dividendincome")}:</p>
                            </Col>
                            <Col flex={"auto"}>
                                <Statistic valueStyle={{
                                    color: '#f28703',
                                    fontSize: "22px",
                                    fontWeight: "400",
                                    paddingLeft: "10px"
                                }} value={fromValue(new BigNumber(vipProfit).plus(balance1).toFixed())} precision={2} />
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
        </div>
    )
}
