import React, { FunctionComponent, useEffect, useState } from "react";
import { smartContract } from "./smartContract";

const Web3 = require("web3");

declare global {
  interface Window {
    ethereum: any;
    web3: any;
  }
}

interface FormData {
  amount: number;
  receiverAddress: string;
}

const getContract = () => {
  var weenusContract = window.web3.eth.contract(smartContract);
  var weenus = weenusContract.at("0x101848D5C5bBca18E6b4431eEdF6B95E9ADF82FA");
  return weenus;
};
const App: FunctionComponent = () => {
  const [error, setError] = useState({
    show: false,
    message: "",
  });
  const [logined, setLogined] = useState<boolean>(false);
  const [ethBalance, setEthBalance] = useState<string>("");
  const [weenusBalance, setWeenusBalance] = useState<string>("");

  const [pendingTxHash, setPendingTxHash] = useState<string>("");
  const [pendingTxHashStatus, setPendingTxHashStatus] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    amount: 0,
    receiverAddress: "",
  });

  useEffect(() => {
    getBalances();
  }, []);

  const getBalances = () => {
    window.web3.eth.getAccounts(function (err: any, accs: any) {
      if (err !== null) {
        setError({
          show: true,
          message: err,
        });
      } else if (accs.length === 0) {
        setLogined(false);
      } else {
        setLogined(true);
        let accounts = accs;
        let account = accounts[0];
        window.web3.eth.getBalance(account, function (err: any, balance: any) {
          let bal = window.web3.fromWei(balance, "ether") + " ETH";
          setEthBalance(bal);
        });
        var weenus = getContract();
        weenus.balanceOf(
          "0x101848D5C5bBca18E6b4431eEdF6B95E9ADF82FA",
          (err: any, balance: any) => {
            let bal = window.web3.fromWei(balance, "ether") + " WEENUS";
            setWeenusBalance(bal);
          }
        );
      }
    });
  };

  //connect web3 with metamask
  const metaMaskEnabled = () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      window.ethereum
        .enable()
        .then((res: any) => {
          window.location.reload();
        })
        .catch((error: any) => {
          setError({
            show: true,
            message: error.message,
          });
          setLogined(false);
          setTimeout(() => {
            setError({
              show: false,
              message: "",
            });
          }, 3000);
        });
      return true;
    }
    return false;
  };

  const changeData = (e: any) =>
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  const sendTokens = (e: any) => {
    e.preventDefault();
    setError({
      show: false,
      message: "",
    });
    const { amount, receiverAddress } = formData;
    if (receiverAddress === "") {
      setError({
        show: true,
        message: "Enter Receiver Address",
      });
      setTimeout(() => {
        setError({
          show: false,
          message: "",
        });
      }, 3000);
      return;
    }

    var weenus = getContract();
    weenus.transfer(
      receiverAddress,
      amount,
      function (err: any, response: any) {
        if (!!err) {
          setError({
            show: true,
            message: err.message,
          });
          setTimeout(() => {
            setError({
              show: false,
              message: "",
            });
          }, 6000);
        }
        if (!!response) {
          setPendingTxHash(response);
          //update balance on response
          getBalances();
        }
      }
    );
  };

  useEffect(() => {
    if (pendingTxHash !== "") {
      setPendingTxHashStatus("Loading...");
      setInterval(() => {
        window.web3.eth.getTransactionReceipt(
          pendingTxHash,
          function (error: any, result: any) {
            if (!!error) {
            }
            if (!!result) {
              setPendingTxHashStatus(result.status);
              console.log(result.status);
              return;
            }
          }
        );
      }, 1000);
    }
  }, [pendingTxHash]);
  const { amount, receiverAddress } = formData;
  return (
    <div
      style={{
        display: "grid",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "750px",
          border: "1px solid black",
          padding: "10px",
          margin: "10px",
        }}
      >
        {logined ? (
          <p>Connected to Meta Mask</p>
        ) : (
          <button onClick={metaMaskEnabled}>Connect to Meta Mask</button>
        )}
        <p>Eth Balnace: {ethBalance}</p>
        <p>Weenus Balnace: {weenusBalance}</p>
      </div>

      <form
        onSubmit={sendTokens}
        style={{
          margin: "10px",
          padding: "10px",
          border: "1px solid black",
          display: "grid",
          gridRowGap: "10px",
        }}
      >
        <label>Transaction Form</label>
        <input
          placeholder="Enter Amount..."
          value={amount}
          onChange={changeData}
          name="amount"
        />
        <input
          placeholder="Enter Address..."
          value={receiverAddress}
          onChange={changeData}
          name="receiverAddress"
        />
        <p style={{ color: "red", fontSize: "16px", fontWeight: 600 }}>
          {error.show && error.message}
        </p>
        {pendingTxHash && (
          <>
            <p style={{ color: "green", fontSize: "16px", fontWeight: 600 }}>
              PendingTx Hash: {pendingTxHash}
            </p>
            <p style={{ color: "green", fontSize: "14px", fontWeight: 500 }}>
              Status: &nbsp;{pendingTxHashStatus}
            </p>
          </>
        )}
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default App;
