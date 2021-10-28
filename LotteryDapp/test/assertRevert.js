module.exports = async (promise) => {
    try {
        await promise;
        assert.fail('Expected revert not received');
    } catch (error) { // error를 e로 축약하여 작성하면 테스트 시 error를 찾을 수 없다고 오류 발생
        const revertFound = error.message.search('revert') >= 0;
        assert(revertFound, `Expected "revert", got ${error} instead`);
    }
}