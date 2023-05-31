import { useEffect, useState } from 'react';
import { isAddress, useERC20, useFace, usePool } from '../../hooks/useContract';
import { useWeb3React } from '@web3-react/core';
import { ethers } from "ethers"
import { Col, Row, Statistic, Modal, message, Rate } from 'antd';
import { formatString, fromValue, toValue, verify } from '../../utils/formatting';
import BigNumber from "bignumber.js";
import { MAX_UNIT256 } from '../../constants';
import { AddressZero } from '@ethersproject/constants'
import { iconCode, iconRecharge, iconRecharge1, iconScanCode } from '../../image';
import QRCode from 'qrcode.react';
import loadingStore from '../../state';
import { useTranslation } from 'react-i18next';
import { MinusOutlined } from '@ant-design/icons';
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
    const [tokenAmount, setTokenAmount] = useState<string>('0');
    const [inviteProfit, setInviteProfit] = useState<string>('0');
    const [vip, setVip] = useState<string>('0');
    const [vipProfit, setVipProfit] = useState<string>('0');

    const [score, setScore] = useState<string>('0');
    const [maxScore, setMaxScore] = useState<string>('0');
    const [selfScore, setSelfScore] = useState<string>('0');
    const [inviter, setInviter] = useState<string>('');
    const [isInviter, setIsInviter] = useState<boolean>(false);
    // const [userAddr, setUserAddr] = useState<string>("");
    const [rechargeAmount, setRechargeAmount] = useState<string>('');
    const [rechargeBackAmount, setRechargeBackAmount] = useState<string>('');
    const [rechargeModal, setRechargeModal] = useState<boolean>(false);
    const [codeModal, setCodeModal] = useState<boolean>(false);


    const [decimalsU, setDecimalsU] = useState<number>(0);
    const [decimalsToken, setDecimalsToken] = useState<number>(0);


    useEffect(() => {
        getAllowance()
        init();
    }, [account])

    const init = () => {
        getUsers();
        getBalanceOf();
        getDecimals()
    }
    const getDecimals = () => {
        tokenContract?.decimals().then(function (decimals: any) {
            console.log(decimals, "TokenBalance")
            setDecimalsToken(Number(decimals.toString()));
        });

        usdtContract?.decimals().then(function (decimals: any) {
            console.log(decimals, "TokenBalance")
            setDecimalsU(Number(decimals.toString()));
        });
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
            setTokenAmount(res.tokenAmount.toString())
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

        // if (!isAddress(userAddr) || userAddr === AddressZero) {
        //     message.error(`${t("correctAddress")}`)
        //     return
        // }

        let tokenValue = toValue(rechargeAmount,decimalsU);

        loadingStore.changeLoad(`${t("Loading")}`, true, "loading");
        // faceContract?.estimateGas.deposit(inviter, userAddr, tokenValue, { from: account }).then((gas: any) => {
        //     faceContract?.deposit(inviter, userAddr, tokenValue, { from: account, gasLimit: gas.mul(120).div(100) })
        faceContract?.estimateGas.deposit(inviter, account, tokenValue, { from: account }).then((gas: any) => {
            faceContract?.deposit(inviter, account, tokenValue, { from: account, gasLimit: gas.mul(120).div(100) })
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
        // setUserAddr("");
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
                        decimals: Number(process.env.REACT_APP_NET_DECIMALS)
                    },
                    rpcUrls: [process.env.REACT_APP_NET_URL],
                    // blockExplorerUrls: [process.env.REACT_APP_NET_SCAN]
                }];

                console.log("params", params)
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


    const getPrice = async (value: any) => {
        // quote
        let data = await faceContract?.quote(toValue(value,decimalsU))
        console.log("getPrice", data, data.toString())
        setRechargeBackAmount(data.toString())
    }
    return (
        <div className='mainContent'>
            <div className=" main">
                <div className="home">
                    <div className='card card-shadow-gray' style={{
                        marginTop: "20px"
                    }}>
                        <Row >
                            <Col >
                                <p style={{
                                    lineHeight: "35px",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    color: "#F2FA5A"
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
                                    color: '#F2FA5A',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }} value={fromValue(balance0,decimalsU)} precision={2} />
                            </Col>
                            <Col flex={"20px"} style={{ textAlign: "center" }}>+</Col>
                            <Col >
                                <Statistic valueStyle={{
                                    color: '#F2FA5A',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }} value={fromValue(balance1,decimalsToken)} precision={2} />
                            </Col>
                        </Row>

                        <Row className='texthight'>
                            <Col >{t("tokenAmount")}:</Col>
                            <Col flex={1}>
                                <Statistic valueStyle={{
                                    color: '#F2FA5A',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }} value={fromValue(tokenAmount,decimalsToken)} precision={2} suffix={"RDX"} />
                            </Col>
                        </Row>
                        <Row className='textcenter'>
                            <Col flex={"1"} style={{
                                textAlign: "center",
                                paddingBottom: "10px",
                            }}>
                                <Rate disabled style={{
                                    color: "#F2FA5A"
                                }} defaultValue={Number(vip)} />
                            </Col>
                        </Row>
                        <Row className='textcenter' style={{
                            marginTop: "12px"
                        }}>
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
                                                isInviter ? <input className='ipt' value={inviter} disabled /> : <div style={{
                                                    display: "flex"
                                                }}>
                                                    <input className='ipt' value={inviter} onChange={(e) => {
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

                                    {/* <Row className='texthight'>
                                        <Col span={24}>
                                            <p> {t("useraddress")}:</p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <div style={{
                                                display: "flex"
                                            }}>
                                                <input className='ipt' value={userAddr} onChange={(e) => {
                                                    setUserAddr(e.target.value)
                                                }} />
                                                <img src={iconScanCode} onClick={() => {
                                                    tp.invokeQRScanner().then((res: any) => { setUserAddr(res) })
                                                }} alt="" />
                                            </div>

                                        </Col>
                                    </Row> */}
                                    <Row className='texthight'>
                                        <Col span={24}>
                                            <p>{t("Rechargeamount")}:
                                                {
                                                    rechargeAmount != "" && !new BigNumber(rechargeAmount).isZero() ? <> {rechargeAmount} USDT ≈  {fromValue(rechargeBackAmount,decimalsToken)} RDX</> : <></>
                                                }
                                            </p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <input className='ipt' value={rechargeAmount} onChange={(e) => {
                                                let value = verify(e.target.value);
                                                if (value != "" && !new BigNumber(value).isZero()) {
                                                    console.log(value);
                                                    getPrice(value)
                                                }
                                                setRechargeAmount(value);
                                            }} />
                                        </Col>
                                    </Row>

                                    <Row className='textcenter' style={{
                                        marginTop: "20px"
                                    }}>
                                        <Col flex={1}>
                                            <p className='btn'>
                                                <span onClick={() => {
                                                    closeModal();
                                                }}>{t("Cancel")}</span>
                                            </p>
                                        </Col>
                                        <Col flex={1}>
                                            {
                                                isApprove ? <p className='btn'>
                                                    <span onClick={() => {
                                                        sendDeposit()
                                                    }}>{t("Recharge")}</span>
                                                </p> : <p className='btn'>
                                                    <span onClick={() => {
                                                        sendApprove()
                                                    }}>{t("Approve")}</span>
                                                </p>
                                            }
                                        </Col>
                                    </Row>
                                </div>
                            </Modal>

                            <Col flex={1}>
                                <p className='btn'>
                                    <span onClick={() => {
                                        setRechargeModal(true);
                                    }}>{t("Recharge")}</span>
                                </p>
                            </Col>
                            <Col flex={1}>
                                {
                                    new BigNumber(balance0).plus(balance1).isGreaterThan(0) ?
                                        <p className='btn'>
                                            <span onClick={() => {
                                                sendSettle();
                                            }}>{t("withdraw")}</span>
                                        </p> : <p className='btned'>
                                            <span >{t("withdraw")}</span>
                                        </p>
                                }
                            </Col>
                        </Row>
                    </div>

                    <div className='card card-shadow-gray'>
                        <Row>
                            <Col span={24} className='card-box'>
                                <p>
                                    —— {t("achievement")}  ——
                                </p>
                            </Col>
                        </Row>
                        <Row className='textcenter box' style={{
                            borderBottom: "1px dashed #F2FA5A",
                            marginBottom: "15px",
                            paddingBottom: "15px"
                        }}>
                            <Col className='boxitem'>
                                <p> {t("shouldbereturned")}</p>
                                <Statistic valueStyle={{
                                    color: '#F2FA5A',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }} value={fromValue(totalAmount,decimalsU)} precision={2} />
                            </Col>
                            <Col className='boxitem'>
                                <p> {t("returned")}</p>
                                <Statistic valueStyle={{
                                    color: '#F2FA5A',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }} value={fromValue(new BigNumber(returnedAmount).plus(balance0).toFixed(),decimalsU)} precision={2} />
                            </Col>
                        </Row>
                        <Row className='textcenter box' >
                            <Col className='boxitem'>
                                <p> {t("Regionalperformance")}</p>
                                <Statistic valueStyle={{
                                    color: '#F2FA5A',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }} value={fromValue(new BigNumber(new BigNumber(maxScore).plus(selfScore).toString()).toFixed(),decimalsU)} precision={2} />
                            </Col>
                            <Col className='boxitem'>
                                <p>{t("Otherachievements")}</p>
                                <Statistic valueStyle={{
                                    color: '#F2FA5A',
                                    fontSize: "22px",
                                    fontWeight: "400"
                                }} value={fromValue(new BigNumber(score).toFixed(),decimalsU)} precision={2} />
                            </Col>
                        </Row>
                    </div>

                    {/* <div className='card card-shadow-origin'> */}
                    <div className='card card-shadow-gray'>
                        <Row>
                            <Col span={24} className='card-box'>
                                <p>
                                    ——{t("income")} ——
                                </p>
                            </Col>
                        </Row>
                        <Row className='texthight'>
                            <Col>
                                <p>{t("staticincome")}:</p>
                            </Col>
                            <Col flex={"auto"}>
                                <Statistic valueStyle={{
                                    color: '#F2FA5A',
                                    fontSize: "22px",
                                    fontWeight: "400",
                                    paddingLeft: "10px"
                                }} value={fromValue(new BigNumber(returnedAmount).plus(balance0).toFixed(),decimalsU)} precision={2} />

                            </Col>
                        </Row>
                        <Row className='texthight'>
                            <Col>
                                <p>{t("Referralincome")}:</p>
                            </Col>
                            <Col flex={"auto"}>
                                <Statistic valueStyle={{
                                    color: '#F2FA5A',
                                    fontSize: "22px",
                                    fontWeight: "400",
                                    paddingLeft: "10px"
                                }} value={fromValue(inviteProfit,decimalsU)} precision={2} />
                            </Col>
                        </Row>
                        <Row className='texthight'>
                            <Col>
                                <p>{t("Dividendincome")}:</p>
                            </Col>
                            <Col flex={"auto"}>
                                <Statistic valueStyle={{
                                    color: '#F2FA5A',
                                    fontSize: "22px",
                                    fontWeight: "400",
                                    paddingLeft: "10px"
                                }} value={fromValue(new BigNumber(vipProfit).plus(balance1).toFixed(),decimalsU)} precision={2} />
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
        </div>
    )
}
