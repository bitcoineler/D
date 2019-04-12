var bcode = require('bcode')
module.exports = {
    planarium: '0.0.1',
    query: {
        web: {
            "v": 3,
            "q": {
                "find": {},
                "limit": 100
            },
            "r": {
                "f": "[.[] | { protocols: .protocols, transaction: .txid, block: .blk, sender: .sender , key: .key, value: .value, type: .type, seq: .seq, \"URI over https\": (if .type == \"c\" then \"https://data.bitdb.network/1KuUr2pSJDao97XM8Jsq8zwLS6W1WtFfLg/c/\\(.pointer)\" elif .type == \"txt\" then null else \"https://b.bitdb.network#\\(.pointer)\" end)}]"
            }
        },
        api: {
            timeout: 50000,
            sort: {
                "blk.i": -1,
                "seq": -1,
                "txid": -1
            },
            limit: 10000,
            concurrency: {
                aggregate: 7
            },
        },
        log: true
    },
    socket: {
        web: {
            "v": 3,
            "q": {
                "find": {},
                "limit": 100
            },
            "r": {
                "f": "[.[] | { protocols: .protocols, transaction: .txid, block: .blk, sender: .sender , key: .key, value: .value, type: .type, seq: .seq, \"URI over https\": (if .type == \"c\" then \"https://data.bitdb.network/1KuUr2pSJDao97XM8Jsq8zwLS6W1WtFfLg/c/\\(.pointer)\" elif .type == \"txt\" then null else \"https://b.bitdb.network#\\(.pointer)\" end)}]"
            }
        },
        api: {},
        topics: ["c", "u"]
    },
    transform: {
        request: bcode.encode,
        response: bcode.decode
    },
    url: "mongodb://localhost:27020",
    port: 3000,
}
