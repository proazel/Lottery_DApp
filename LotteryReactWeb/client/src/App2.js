import React, { useEffect, useState, useReducer } from "react";
import getWeb3 from "./getWeb3";
// npm install bootstrap
import 'bootstrap/dist/css/bootstrap.css';

import "./App.css";

// migrate -> contract address
let lotteryAddress = '0x3C9EDa1126Fd0D27405A0680553bcd2ee0deFdbC';
// LotteryDapp -> /build/contracts/Lottery.json
// Line Break Removal Tool 링크 : https://www.textfixer.com/tools/remove-line-breaks.php
let lotteryABI = [ { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "BET", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "bytes1", "name": "answer", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "DRAW", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "bytes1", "name": "answer", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "FAIL", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "REFUND", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "bytes1", "name": "answer", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "WIN", "type": "event" }, { "inputs": [], "name": "answerForTest", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address payable", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getPot", "outputs": [ { "internalType": "uint256", "name": "pot", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes1", "name": "challenges", "type": "bytes1" } ], "name": "betAndDistribute", "outputs": [ { "internalType": "bool", "name": "result", "type": "bool" } ], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "bytes1", "name": "challenges", "type": "bytes1" } ], "name": "bet", "outputs": [ { "internalType": "bool", "name": "result", "type": "bool" } ], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "distribute", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "answer", "type": "bytes32" } ], "name": "setAnswerForTest", "outputs": [ { "internalType": "bool", "name": "result", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "internalType": "bytes32", "name": "answer", "type": "bytes32" } ], "name": "isMatch", "outputs": [ { "internalType": "enum Lottery.BettingResult", "name": "", "type": "uint8" } ], "stateMutability": "pure", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "index", "type": "uint256" } ], "name": "getBetInfo", "outputs": [ { "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" }, { "internalType": "address", "name": "bettor", "type": "address" }, { "internalType": "bytes1", "name": "challenges", "type": "bytes1" } ], "stateMutability": "view", "type": "function" } ];

const App = () => {
  const [state, setState] = useState({
    betRecords: [],
    winRecords: [],
    failRecords: [],
    pot: '0',
    challenges: ['A', 'B'],
    finalRecords: [{
      bettor: '0xabcd...',
      index: '0',
      challenges: 'ab',
      answer: 'ab',
      targetBlockNumber: '10',
      pot: '0',
    }],
  });

  const getweb = async () => {
    let web3 = await getWeb3();
    let lotteryContract = new web3.eth.Contract(lotteryABI, lotteryAddress);
    
    let pot = await lotteryContract.methods.getPot().call();
    let owner = await lotteryContract.methods.owner().call();

    console.log(pot);
    console.log(owner);
  }

  const getBetEvents = async () => {
    const records = []; // 이벤트 관련 레코드를 넣을 배열

    let web3 = await getWeb3();
    let lotteryContract = new web3.eth.Contract(lotteryABI, lotteryAddress);
    // getPastEvents() : 해당 이벤트의 지난 내역을 가져옴
    let events = await lotteryContract.getPastEvents('BET', { fromBlock: 0, toBlock: 'latest' });

    console.log(events);
  }

  const bet = async () => {
    let web3 = await getWeb3();
    let accounts = await web3.eth.getAccounts();
    let account = accounts[0];
    let lotteryContract = new web3.eth.Contract(lotteryABI, lotteryAddress);
    let nonce = await web3.eth.getTransactionCount(account);

    lotteryContract.methods.betAndDistribute('0xcd').send({ from: account, value: 5000000000000000, gas: 300000, nonce: nonce });
  }

  useEffect(() => {
    getweb();
    getBetEvents();
  }, []);

  const getCard = (_character, _cardStyle) => {
    let _card = '';

    if (_character === 'A') {
      _card = '🂡';
    }
    if (_character === 'B') {
      _card = '🂱';
    }
    if (_character === 'C') {
      _card = '🃁';
    }
    if (_character === 'D') {
      _card = '🃑';
    }

    return (
      <button className={_cardStyle}>
        <div className="card-body text-center">
          <p className="card-text"></p>
          <p className="card-text text-center" style={{fontSize:300}}>{_card}</p>
          <p className="card-text"></p>
        </div>
      </button>
    );
  }

  return (
    <div className="App">
      {/* Heaer - Pot, Betting characters */}
      <div className="container">
        <div className="jumbotron">
          <h1>Current Pot : {state.pot}</h1>
          <p>Lottery tutorial</p>
          <p>Your Bet</p>
          <p>{state.challenges[0]} {state.challenges[1]}</p>
        </div>
      </div>

      {/* Card section */}
      <div className="container">
        <div className="card-group">
          {getCard('A', 'card bg-primary')}
          {getCard('B', 'card bg-warning')}
          {getCard('C', 'card bg-danger')}
          {getCard('D', 'card bg-success')}
        </div>
      </div>
      <br />

      <div className="container">
        <button className="btn btn-danger btn-lg">BET!</button>
      </div>
      <br/>

      <div className="container">
        <table className="table table-dark table-striped">
          <thead>
            <tr>
              <th>Index</th>
              <th>Address</th>
              <th>Challenge</th>
              <th>Answer</th>
              <th>Pot</th>
              <th>Status</th>
              <th>AnswerBlockNumber</th>
            </tr>
          </thead>
          <tbody>
            {
              state.finalRecords.map((record, k) => {
                return (
                  <tr key={k}>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;