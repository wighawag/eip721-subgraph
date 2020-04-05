module.exports = {
    zeroAddress: '0x0000000000000000000000000000000000000000',
    extractRevertMessageFromHexString(hexData) {
        let revertMessage = '';
        const messageSig = hexData.slice(2,10);
        if (messageSig != '08c379a0') {
            throw new Error(`Invalid Revert message prefix : ${messageSig}`);
        }
        const messageLL = hexData.slice(10, 10 + 64);
        if (messageLL != '0000000000000000000000000000000000000000000000000000000000000020') {
            throw new Error(`Invalid Revert message data length : ${messageLL}`);
        }
        const messageL = hexData.slice(10 + 64, 10 + 64 + 64);
        let messageLength = 0;
        try {
            messageLength = parseInt(messageL, 16);
        } catch (e) {
            throw new Error(`cannot parse message length : ${messageL}`);
        }
        if (messageLength > 0) {
            revertMessage = hexData.slice(10 + 64 + 64, 10 + 64 + 64 + messageLength * 2);
        } else {
            revertMessage = '';
        }
        console.log({hexData, revertMessage, messageSig, messageLL, messageL, messageLength, length : hexData.length});
        return Buffer.from(revertMessage, 'hex').toString('utf8');
    },
    async expectRevert(promise, expectedMessage) {
        let receipt;
        try {
            receipt = await promise;
        } catch (error) {
            if (!expectedMessage) {
                return true;
            }
            let revertMessage;
            let message = error.message;
            if (error.stackTrace && error.stackTrace.length > 0) {
                const buf = error.stackTrace[0].message;
                const messageSig = buf.slice(0, 4).toString('hex');
                if (messageSig != '08c379a0') {
                    throw new Error(`Invalid Revert message prefix : ${messageSig}`);
                }
                const messageLL = buf.slice(4, 4 + 32).toString('hex');
                if (messageLL != '0000000000000000000000000000000000000000000000000000000000000020') {
                    throw new Error(`Invalid Revert message data length : ${messageLL}`);
                }
                const messageL = buf.slice(4 + 32, 4 + 32 + 32).toString('hex');
                let messageLength = 0;
                try {
                    messageLength = parseInt(messageL, 16);
                } catch (e) {
                    throw new Error(`cannot parse message length : ${messageL}`);
                }
                if (messageLength > 0) {
                    msg = buf.slice(4 + 32 + 32, 4 + 32 + 32 + messageLength);
                    revertMessage = msg.toString('utf8');    
                } else {
                    revertMessage = '';
                }
            } else {
                revertMessage = '';
            }
            if (!message) {
                message = revertMessage;
            }
            if (typeof message !== 'string'){
                message = message.toString();
            }
            const isExpectedMessagePresent = (revertMessage && revertMessage == expectedMessage) || message.search(expectedMessage) >= 0;
            if (!isExpectedMessagePresent) {
                throw new Error(`Revert message : "${expectedMessage}" not present, instead got : "${revertMessage || message}"`);
            }
            return true;
        }
    
        if (receipt.status === '0x0' || receipt.status === 0 || receipt.status === '0') {
            if (expectedMessage) {
                throw new Error(`Revert message not parsed : "${expectedMessage}"`);
            }
            return true;
        }
        // throw new Error(`Revert expected`);
    }
}