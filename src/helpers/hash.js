const md5 = require("md5")

function makeHash(){
    const ts = process.env.ts || 213455;
    const apiKey = process.env.apiKey || '';
    const privateKey = process.env.privateKey || '';

    const hash = md5(ts+privateKey+apiKey);

    return {
        ts,
        apiKey,
        hash
    }
}

module.exports = {
    makeHash
}

