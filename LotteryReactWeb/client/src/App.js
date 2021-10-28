import React, { useEffect, useReducer } from "react";
import getWeb3 from "./getWeb3";
// npm install bootstrap
import 'bootstrap/dist/css/bootstrap.css';

import "./App.css";

// migrate -> contract address
let lotteryAddress = '0x3C9EDa1126Fd0D27405A0680553bcd2ee0deFdbC';
// LotteryDapp -> /build/contracts/Lottery.json
// Line Break Removal Tool 링크 : https://www.textfixer.com/tools/remove-line-breaks.php
let lotteryABI = [ { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "BET", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "bytes1", "name": "answer", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "DRAW", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "bytes1", "name": "answer", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "FAIL", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "REFUND", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "bytes1", "name": "answer", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" } ], "name": "WIN", "type": "event" }, { "inputs": [], "name": "answerForTest", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address payable", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getPot", "outputs": [ { "internalType": "uint256", "name": "pot", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes1", "name": "challenges", "type": "bytes1" } ], "name": "betAndDistribute", "outputs": [ { "internalType": "bool", "name": "result", "type": "bool" } ], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "bytes1", "name": "challenges", "type": "bytes1" } ], "name": "bet", "outputs": [ { "internalType": "bool", "name": "result", "type": "bool" } ], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "distribute", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "answer", "type": "bytes32" } ], "name": "setAnswerForTest", "outputs": [ { "internalType": "bool", "name": "result", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "internalType": "bytes32", "name": "answer", "type": "bytes32" } ], "name": "isMatch", "outputs": [ { "internalType": "enum Lottery.BettingResult", "name": "", "type": "uint8" } ], "stateMutability": "pure", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "index", "type": "uint256" } ], "name": "getBetInfo", "outputs": [ { "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" }, { "internalType": "address", "name": "bettor", "type": "address" }, { "internalType": "bytes1", "name": "challenges", "type": "bytes1" } ], "stateMutability": "view", "type": "function" } ];

const initialState = {
  betRecords: [],
  winRecords: [],
  failRecords: [],
  pot: '0',
  challenges: ['A', 'B'],
  finalRecords: [{
    bettor: '',
    index: '0',
    challenges: 'ab',
    answer: 'ab',
    targetBlockNumber: '10',
    pot: '0',
  }],
  lotteryContract: null,
  account: null,
  web3: null,
  owner: null,
  events: [],
}

const INIT = 'INIT';
const GET_POT = 'GET_POT';
const CARD_CLICK = 'CARD_CLICK';
const GET_BET_EVENTS = 'GET_BET_EVENTS';

const reducer = (state, action) => {
  switch (action.type) {
    case INIT: {
      let { web3, lotteryContract, account, owner, events } = action;
      console.log('zz',events);
      return {
        ...state, web3, lotteryContract, account, owner, events,
      }
    }
    case GET_POT: {
      let { pot } = action;
      return {
        ...state, pot,
      }
    }
    case CARD_CLICK: {
      let { challenges, _character } = action;
      return {
        ...state, challenges:[challenges, _character],
      }
    }
    case GET_BET_EVENTS: {
      let { betRecords } = action;
      return {
        ...state, betRecords,
      }
    }
  }
}

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  let { web3, lotteryContract, challenges, account, events } = state;

  const getweb = async () => {
    let web3 = await getWeb3();
    let lotteryContract = new web3.eth.Contract(lotteryABI, lotteryAddress);
    let accounts = await web3.eth.getAccounts();
    let account = accounts[0];
    let owner = await lotteryContract.methods.owner().call();
    let events = await lotteryContract.getPastEvents('BET', { fromBlock: 0, toBlock: 'latest' });

    dispatch({ type: 'INIT', web3, lotteryContract, account, owner, events });
  }
  
  const getPot = async () => {
    let web3 = await getWeb3();
    let lotteryContract = new web3.eth.Contract(lotteryABI, lotteryAddress);
    
    let pot = await lotteryContract.methods.getPot().call(); // number
    let potString = web3.utils.fromWei(pot.toString(), 'ether'); // string

    // useState 사용 시
    // 객체안에 ...state를 넣어주면 기본값을 유지하면서 원하는 부분만 추가 가능
    // setState({ ...state, pot: potString });
    dispatch({ type: 'GET_POT', pot: potString });
  }

  // 오류발생
  const getBetEvents = async () => {
    console.log('check');
    const records = []; // 이벤트 관련 레코드를 넣을 배열
    console.log('check2');
    let web3 = await getWeb3();
    let lotteryContract = new web3.eth.Contract(lotteryABI, lotteryAddress);
    
    console.log('events', events);

    let eventss = await lotteryContract.getPastEvents('BET', { fromBlock: 0, toBlock: 'latest' });

    // getPastEvents() : 해당 이벤트의 지난 내역을 가져옴
    
    console.log('ss', eventss);

    for (let i = 0; i < events.length; i += 1) {
      const record = {};
      record.index = parseInt(events[i].returnValues.index, 10).toString();
      record.bettor = events[i].returnValues.bettor;
      record.betBlockNumber = events[i].blockNumber;
      record.targetBlockNumber = events[i].returnValues.answerBlockNumber.toString();
      record.challenges = events[i].returnValues.challenges;
      record.win = 'Not Revealed';
      record.answer = '0x00';
      record.unshift(record); // unshift() : push의 반대
      console.log('레코드', record);
    }

    console.log('레코즈', records);
    dispatch({ type: 'GET_BET_EVENTS', betRecords: records });
  }

  const bet = async () => {
    let nonce = await web3.eth.getTransactionCount(account);
    let challengesWord = '0x' + state.challenges[0].toLowerCase() + state.challenges[1].toLowerCase();

    lotteryContract.methods.betAndDistribute(challengesWord).send({ from: account, value: 5000000000000000, gas: 300000, nonce: nonce })
    .on('transactionHash', (hash) => {
      console.log('hash', hash);
    })
  }

  const pollData = async () => {
    await getPot();
    await getBetEvents();
  }

  /*
    componentDidmount()는 앞에 async만 달아주면 안에서 await 사용이 가능하지만,
    ex) async componentDidMount() { }

    useEffect에서는 useEffect 안에다가 직접 함수를 만들고, 바로 사용까지 해야함
    ex) useEffect(() => {
      const a = async () => {
        const b = await c();
      }
      a();
    }, []);
  */
  useEffect(() => {
    getweb();
    pollData();
    // setInterval(pollData(), 1000);
  }, []);

  const onClickCard = (_character) => {
    dispatch({ type: 'CARD_CLICK', challenges: challenges[1], _character});
  }

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
      <button className={_cardStyle} onClick={() => {onClickCard(_character)}}>
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
        <button
          className="btn btn-danger btn-lg"
          onClick={bet}
        >
          BET!
        </button>
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