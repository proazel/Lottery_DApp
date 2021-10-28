const assert = require('chai').assert; // npm install chai

// console.log(receipt) 했을 때 나왔던 logs를 inLogs에 넣어줌
// 찾고자하는 문자열을 넣어줬을 때 logs 안에 있는 배열에서 찾고, 있으면 실행
const inLogs = async (logs, eventName) => {
    const event = logs.find(e => e.event === eventName);
    assert.exists(event);
}

module.exports = {
    inLogs,
}