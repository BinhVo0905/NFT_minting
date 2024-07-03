"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openWallet = openWallet;
exports.encodeOffChainContent = encodeOffChainContent;
exports.sendTransferWithRetry = sendTransferWithRetry;
const ton_crypto_1 = require("ton-crypto");
const ton_1 = require("ton");
const toncenterBaseEndpoint = "https://testnet.toncenter.com";
const client = new ton_1.TonClient({
    endpoint: `${toncenterBaseEndpoint}/api/v2/jsonRPC`,
    apiKey: process.env.TONCENTER_API_KEY,
});
function openWallet(mnemonic) {
    return __awaiter(this, void 0, void 0, function* () {
        const keyPair = yield (0, ton_crypto_1.mnemonicToPrivateKey)(mnemonic);
        console.log(mnemonic);
        const wallet = ton_1.WalletContractV4.create({
            workchain: 0,
            publicKey: keyPair.publicKey,
        });
        const contract = client.open(wallet);
        return { contract, keyPair };
    });
}
function bufferToChunks(buff, chunkSize) {
    const chunks = [];
    while (buff.byteLength > 0) {
        chunks.push(buff.subarray(0, chunkSize));
        buff = buff.subarray(chunkSize);
    }
    return chunks;
}
function makeSnakeCell(data) {
    const chunks = bufferToChunks(data, 127);
    if (chunks.length === 0) {
        return (0, ton_1.beginCell)().endCell();
    }
    if (chunks.length === 1) {
        return (0, ton_1.beginCell)().storeBuffer(chunks[0]).endCell();
    }
    let curCell = (0, ton_1.beginCell)();
    for (let i = chunks.length - 1; i >= 0; i--) {
        const chunk = chunks[i];
        curCell.storeBuffer(chunk);
        if (i - 1 >= 0) {
            const nextCell = (0, ton_1.beginCell)();
            nextCell.storeRef(curCell);
            curCell = nextCell;
        }
    }
    return curCell.endCell();
}
function encodeOffChainContent(content) {
    let data = Buffer.from(content);
    const offChainPrefix = Buffer.from([0x01]);
    data = Buffer.concat([offChainPrefix, data]);
    return makeSnakeCell(data);
}
function sendTransferWithRetry(wallet_1, sendTransferFunction_1) {
    return __awaiter(this, arguments, void 0, function* (wallet, sendTransferFunction, maxRetries = 5) {
        let retryCount = 0;
        const backoffFactor = 1000; // Initial delay of 1 second
        while (retryCount < maxRetries) {
            try {
                const result = yield sendTransferFunction();
                console.log("Transfer successful");
                return result;
            }
            catch (error) {
                if (error.message.includes("Ratelimit exceed")) {
                    retryCount++;
                    const sleepTime = backoffFactor * Math.pow(2, retryCount);
                    console.log(`Rate limit exceeded. Retrying in ${sleepTime / 1000} seconds...`);
                    yield delay(sleepTime);
                }
                else {
                    console.error("Error during transfer:", error);
                    throw error;
                }
            }
        }
        throw new Error("Max retries exceeded. Transfer failed.");
    });
}
function delay(sleepTime) {
    throw new Error("Function not implemented.");
}
//# sourceMappingURL=utils.js.map