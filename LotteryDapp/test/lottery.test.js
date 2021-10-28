const Lottery = artifacts.require("Lottery");
const assertRevert = require("./assertRevert");
const expectEvent = require("./expectEvent");

contract('Lottery', function ([deployer, user1, user2]) {
    let lottery;
    let betAmount = 5 * 10 ** 15; // 5000000000000000
    let betAmountBN = new web3.utils.BN('5000000000000000');
    let bet_block_interval = 3;

    beforeEach(async () => {
        // console.log('Before each');
        lottery = await Lottery.new(); // 배포, 이렇게 테스트용 배포 코드를 작성해서 사용하는게 좋음
    });

    // it('Basic test', async () => {
    //     console.log('Basic test');
    //     let owner = await lottery.owner();
    //     let value = await lottery.getSomeValue();

    //     console.log(`owner : ${owner}`);
    //     console.log(`value : ${value}`);

    //     assert.equal(value, 5);
    // });

    // .only() = 모카 테스트 시 특정 테스트 케이스만 테스트
    it('getPot sholud return current pot', async () => {
        let pot = await lottery.getPot();

        assert.equal(pot, 0);
    });

    describe('Bet', function () {
        it('should fail when the bet money is not 0.005 ETH', async () => {
            // Fail transaction
            // 발생한 에러를 assertRevert()에서 try/catch문으로 받음
            await assertRevert('0xab', { from: user1, value: 4000000000000000 });
            // transaction object {chainId, value, to, form, gas(Limit), gasPrice}
        });

        it('should put the bet to the bet queue with 1 bet', async () => {
            // 배팅
            let receipt = await lottery.bet('0xab', { from: user1, value: betAmount});
            // console.log(receipt);
            let pot = await lottery.getPot();
            assert.equal(pot, 0);

            // 컨트랙트 발생 시 밸런스 체크 == 0.005 ETH
            let contractBalance = await web3.eth.getBalance(lottery.address);
            assert.equal(contractBalance, betAmount);
            
            // 배팅 정보 확인
            let currentBlockNumber = await web3.eth.getBlockNumber();
            let bet = await lottery.getBetInfo(0);
        
            assert.equal(bet.answerBlockNumber, currentBlockNumber + bet_block_interval);
            assert.equal(bet.bettor, user1);
            assert.equal(bet.challenges, '0xab');

            // 로그 확인
            await expectEvent.inLogs(receipt.logs, 'BET');
        });
    });

    describe('Distribute', function () {
        describe.only('When the answer is checkable', function () {
            it('should give the user the pot when the answer matches', async () => {
                // 두 글자 다 맞았을 때
                await lottery.setAnswerForTest('0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc', { from: deployer });

                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 1 -> 4
                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 2 -> 5
                await lottery.betAndDistribute('0xab', { from: user1, value: betAmount }); // 3 -> 6
                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 4 -> 7
                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 5 -> 8
                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 6 -> 9

                let potBefore = await lottery.getPot(); // 0.01 ETH
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                
                // user1이 팟머니 획득
                let receipt7 = await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 7 -> 10
                
                let potAfter = await lottery.getPot(); // 0 ETH
                let user1BalanceAfter = await web3.eth.getBalance(user1); // before + 0.015 ETH

                // 팟머니의 변화량 확인
                assert.equal(potBefore.toString(), new web3.utils.BN('10000000000000000').toString());
                assert.equal(potAfter.toString(), new web3.utils.BN('0').toString());

                // 유저(승자)의 밸런스 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.add(potBefore).add(betAmountBN).toString(), new web3.utils.BN(user1BalanceAfter).toString());
            });

            it('should give the user the amount he or she bet when a single character matches', async () => {
                // 한 글자만 맞았을 때
                await lottery.setAnswerForTest('0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc', { from: deployer });

                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 1 -> 4
                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 2 -> 5
                await lottery.betAndDistribute('0xaf', { from: user1, value: betAmount }); // 3 -> 6
                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 4 -> 7
                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 5 -> 8
                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 6 -> 9

                let potBefore = await lottery.getPot(); // 0.01 ETH
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                
                // user1이 팟머니 획득
                let receipt7 = await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 7 -> 10
                
                let potAfter = await lottery.getPot(); // 0.01 ETH
                let user1BalanceAfter = await web3.eth.getBalance(user1); // before + 0.005 ETH

                // 팟머니의 변화량 확인
                assert.equal(potBefore.toString(), potAfter.toString());

                // 유저(승자)의 밸런스 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.add(betAmountBN).toString(), new web3.utils.BN(user1BalanceAfter).toString());
            });

            it('should get the eth of user when the answer does not match at all', async () => {
                // 다 틀렸을 때
                await lottery.setAnswerForTest('0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc', { from: deployer });

                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 1 -> 4
                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 2 -> 5
                await lottery.betAndDistribute('0xef', { from: user1, value: betAmount }); // 3 -> 6
                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 4 -> 7
                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 5 -> 8
                await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 6 -> 9

                let potBefore = await lottery.getPot(); // 0.01 ETH
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                
                // user1이 팟머니 획득
                let receipt7 = await lottery.betAndDistribute('0xef', { from: user2, value: betAmount }); // 7 -> 10
                
                let potAfter = await lottery.getPot(); // 0.015 ETH
                let user1BalanceAfter = await web3.eth.getBalance(user1); // before

                // 팟머니의 변화량 확인
                assert.equal(potBefore.add(betAmountBN).toString(), potAfter.toString());

                // 유저(승자)의 밸런스 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.toString(), new web3.utils.BN(user1BalanceAfter).toString());
            });
        });
        describe('When the answer is not revealed(Not Mined)', function () {
            // 아무것도 일어나지 않은 것을 확인
            // 배팅 전으로 스마트 컨트랙트의 밸런스, 팟머니의 밸런스, 유저의 밸런스 체크 필요
        });
        describe('When the answer is not revealed(Block limit is passed)', function () {
            // 블록을 계속 증가 시키기
        });
    });

    describe('isMatch', function () {
        // 32 bytes짜리 아무 해쉬값 가져와서 테스트하기 쉽게 3번째 글자 a로 변경
        let blockHash = '0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc';

        // Win
        it('should be BettingResult.Win when two characters match', async () => {    
            let matchingResult = await lottery.isMatch('0xab', blockHash);
            assert.equal(matchingResult, 1);
        });

        // Fail
        it('should be BettingResult.Fail when two characters match', async () => {    
            let matchingResult = await lottery.isMatch('0xcd', blockHash);
            assert.equal(matchingResult, 0);
        });

        // Draw
        it('should be BettingResult.Draw when two characters match', async () => {    
            let matchingResult = await lottery.isMatch('0xaf', blockHash);
            assert.equal(matchingResult, 2);

            matchingResult = await lottery.isMatch('0xfb', blockHash);
            assert.equal(matchingResult, 2);
        });
    });
});