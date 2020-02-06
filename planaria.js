/***************************************
 *
 * Reference: https://github.com/bitcoineler/D
 *
 ***************************************/
const crypto = require('crypto');
const bsv = require('bsv')
const Message = require('bsv/message')

const bitcomB = "19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut"
const bitcomD = "19iG3WTYSsbyos3uJ733yK4zEioi1FesNU"
const bitcomAIP = "15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva"

const B_hex = Buffer.from(bitcomB, 'ascii').toString('hex')
const D_hex = Buffer.from(bitcomD, 'ascii').toString('hex')
const AIP_hex = Buffer.from(bitcomAIP, 'ascii').toString('hex')


//Validate functions
const keyRegex = "^(?!\/)[a-zA-Z0-9_~/@!$&*+,.:;=-]+$"
const maxKeyLength = 1024

const validateKey = function(key) {
    if (key != null) {
        key = Buffer.from(key, 'hex').toString()
        var patt = new RegExp(keyRegex)
        var res = patt.test(key)
        if (res && key.length <= maxKeyLength) {
            return true
        }
    }
    return false
}

const valueRegex = "^[a-zA-Z0-9_~/@!$&*+,.:;=-]+$"
const maxValueLength = 2083 //max URL length in IE

const validateValue = function(value) {
    if (value != null) {
        value = Buffer.from(value, 'hex').toString()
        var patt = new RegExp(valueRegex)
        var res = patt.test(value)
        if (res && value.length <= maxValueLength) {
            return true
        }
    }
    return false
}


const typeRegex = "^b|c|txt|tx$"

const validateType = function(type) {
    if (type != null) {
        type = Buffer.from(type, 'hex').toString()
        var patt = new RegExp(typeRegex, 'i')
        var res = patt.test(type)
        return res
    }
    return false
}

const seqMax = 2 ** 53 - 1

const parseSeq = function(seq) {
    seq = Number(seq)
    if (isNaN(seq) || seq > seqMax || seq < 1) {
        seq = 1
    }
    return seq
}


var updateState = async function(m, o) {
    console.log("UPDATED: ", o)
    await m.state.update({
        name: "state",
        filter: {
            find: {
                "key": o.key,
                "sender": o.sender
            }
        },
        map: function(item) {
            item.blk.i = o.blk.i
            item.blk.t = o.blk.t
            item.txid = o.txid
            item.value = o.value
            item.type = o.type
            item.protocols = o.protocols

            //Publish Bitsocket
            m.output.publish({
                name: "state",
                data: item
            })
            return item
        }
    }).catch(function(e) {
        if (e.code != 11000) {
            console.log("# onblock error = ", e)
            process.exit()
        }
    })
}

var createState = async function(m, o) {
    console.log("CREATED: ", o)
    await m.state.create({
        name: "state",
        data: o,
    }).catch(function(e) {
        if (e.code !== 11000) {
            console.log("# Error", e, m.input.block)
            process.exit()
        }
    })

    //Publish - Bitsocket
    await m.output.publish({
        name: "state",
        data: o
    })
}

var filterAppData = function(o) {
    let outputs = []
    let isdata = false
    for (let i = 0; i < o.out.length; i++) {
        // look for transactions starting with B or D protocol
// she 6.2.20        if (o.out[i].b0 && o.out[i].b0.op && o.out[i].b0.op === 106 && (o.out[i].h2 == D_hex || o.out[i].h2 == B_hex)) {
        if ((o.out[i].h2 == D_hex || o.out[i].h2 == B_hex) || (o.out[i].h1 == D_hex || o.out[i].h1 == B_hex)){
            isdata = true
            outputs.push(o.out[i])
        }
    }
    if (isdata) {
        return {
            tx: {
                h: o.tx.h
            },
            in: o.in.map(function(i) {
                return {
                    e: {
                        a: i.e.a
                    }
                }
            }),
            out: outputs
        }
    } else {
        return null
    }
}

var checkAIPSig = function(signature, address, fields) {
    const bufWriter = new bsv.encoding.BufferWriter();
    for (const field of fields) {
        let bf = Buffer.from(field, 'hex');
        bufWriter.write(bf);
    }
    let appData = bufWriter.toBuffer();
    return Message.verify(appData, address, signature)
}

var app = function(o) {
    let appData = filterAppData(o)
    if (appData) {

        let hexArray = []
        let hexKeys = []
        for (var k in appData.out[0]) {
            if (/^(lh|h)[0-9]{1,2}$/.test(k)) { // lh||h0-99
                hexKeys.push(k)
                hexArray.push(appData.out[0][k])
            }
        }

        let protocols = []
        let p = 0
        protocols[p] = {}

        hexKeys.map(function(a) {
            if (appData.out[0][a] == "7c") { // | = 0x72
                ++p
                protocols[p] = {}
            } else {
                protocols[p][a] = appData.out[0][a]
            }
        })

        let senderAddresses = []
        let key
        let value
        let type
        let seq
        let protocolType
        let isProtocol = false
        let error = false
        let verified = false

        // If D
        if (protocols.length == 1 && protocols[0][Object.keys(protocols[0])[0]] == D_hex) {
            console.log("Protocols: D")
            protocolType = 'D'
            isProtocol = true
            error = false

            senderAddresses = [appData.in[0].e.a] // funding source sender Address

            // D is position 0
            key = protocols[0][Object.keys(protocols[0])[1]]
            value = protocols[0][Object.keys(protocols[0])[2]]
            type = protocols[0][Object.keys(protocols[0])[3]]
            seq = protocols[0][Object.keys(protocols[0])[4]]

            if (validateKey(key) && validateValue(value) && validateType(type) && seq != null) {
                value = Buffer.from(value, 'hex').toString()
                type = Buffer.from(type, 'hex').toString()
            } else {
                error = true
            }

        } else if (protocols.length == 2) {
            // If D + AIP
            if (protocols[0][Object.keys(protocols[0])[0]] == D_hex && protocols[1][Object.keys(protocols[1])[0]] == AIP_hex) {
                console.log("Protocols: D|AIP")
                protocolType = 'D|AIP'
                isProtocol = true
                error = false

                let AIPsignature = protocols[1][Object.keys(protocols[1])[3]]
                let AIPaddress = protocols[1][Object.keys(protocols[1])[2]]

                // D is at position 0
                key = protocols[0][Object.keys(protocols[0])[1]]
                value = protocols[0][Object.keys(protocols[0])[2]]
                type = protocols[0][Object.keys(protocols[0])[3]]
                seq = protocols[0][Object.keys(protocols[0])[4]]


                if (AIPsignature != null && AIPaddress != null && validateKey(key) && validateValue(value) && validateType(type) && seq != null) {
                    AIPsignature = Buffer.from(AIPsignature, 'hex').toString();
                    AIPaddress = Buffer.from(AIPaddress, 'hex').toString()

                    let dataLen = Object.keys(protocols[0]).length + 1 // B.length + 1x"0x7c"
                    let AIPData = hexArray.slice(0, dataLen)

                    try {
                        verified = checkAIPSig(AIPsignature, AIPaddress, AIPData)
                    } catch (e) {
                        console.log("ERROR checkAIPSig: ", e)
                        error = true
                    }

                    if (!error) {
                        if (verified) {
                            senderAddresses = [appData.in[0].e.a, AIPaddress] // funding source Address & AIP Signing Address
                        } else {
                            senderAddresses = [appData.in[0].e.a] // only funding source Address becasue AIP failed to verify
                        }

                        value = Buffer.from(value, 'hex').toString()
                        type = Buffer.from(type, 'hex').toString()
                    }
                } else {
                    error = true
                }

                // If B + D
            } else if (protocols[0][Object.keys(protocols[0])[0]] == B_hex && protocols[1][Object.keys(protocols[1])[0]] == D_hex) {
                console.log("Protocols: B|D")
                protocolType = 'B|D'
                isProtocol = true
                error = false

                // D is at position 1
                senderAddresses = [appData.in[0].e.a] // funding source sender Address
                key = protocols[1][Object.keys(protocols[1])[1]]
                value = protocols[1][Object.keys(protocols[1])[2]]
                type = protocols[1][Object.keys(protocols[1])[3]]
                seq = protocols[1][Object.keys(protocols[1])[4]]

                if (validateKey(key) && value != null && validateType(type) && seq != null) {
                    type = Buffer.from(type, 'hex').toString().toLowerCase()

                    switch (type) {
                        case "c":
                            if (appData.out[0].lb2 && typeof appData.out[0].lb2 === 'string') {
                                buf = Buffer.from(appData.out[0].lb2, 'base64');
                                value = crypto.createHash('sha256').update(buf).digest('hex');
                            } else if (appData.out[0].b2 && typeof appData.out[0].b2 === 'string') {
                                buf = Buffer.from(appData.out[0].b2, 'base64');
                                value = crypto.createHash('sha256').update(buf).digest('hex');
                            } else {
                                error = true
                            }
                            break;
                        case "b":
                            value = o.tx.h // D value = txid
                            break;
                        default:
                            error = true
                    }
                } else {
                    error = true
                }

            }
        } else if (protocols.length == 3) {
            // If B + D + AIP
            if (protocols[0][Object.keys(protocols[0])[0]] == B_hex && protocols[1][Object.keys(protocols[1])[0]] == D_hex && protocols[2][Object.keys(protocols[2])[0]] == AIP_hex) {
                console.log("Protocols: B|D|AIP")
                protocolType = 'B|D|AIP'
                isProtocol = true
                error = false

                let AIPaddress = protocols[2][Object.keys(protocols[2])[2]]
                let AIPsignature = protocols[2][Object.keys(protocols[2])[3]]

                // D is at position 1
                key = protocols[1][Object.keys(protocols[1])[1]]
                value = protocols[1][Object.keys(protocols[1])[2]]
                type = protocols[1][Object.keys(protocols[1])[3]]
                seq = protocols[1][Object.keys(protocols[1])[4]]


                if (AIPsignature != null && AIPaddress != null && validateKey(key) && value != null && validateType(type) && seq != null) {
                    AIPsignature = Buffer.from(AIPsignature, 'hex').toString()
                    AIPaddress = Buffer.from(AIPaddress, 'hex').toString()

                    let dataLen = Object.keys(protocols[0]).length + Object.keys(protocols[1]).length + 2 // B.length + D.length + 2x"0x7c"
                    let AIPData = hexArray.slice(0, dataLen)

                    console.log("AIP DATA: ", AIPsignature, AIPaddress, AIPData)

                    try {
                        verified = checkAIPSig(AIPsignature, AIPaddress, AIPData)
                    } catch (e) {
                        console.log("ERROR checkAIPSig: ", e)
                        error = true
                    }

                    if (!error) {
                        if (verified) {
                            senderAddresses = [appData.in[0].e.a, AIPaddress] // funding source Address & AIP Signing Address
                        } else {
                            senderAddresses = [appData.in[0].e.a] // only funding source Address becasue AIP failed to verify
                            console.log("VERIFY FAILED: ", verified, AIPsignature, AIPaddress, AIPData)
                        }

                        type = Buffer.from(type, 'hex').toString().toLowerCase()

                        switch (type) {
                            case "c":
                                if (appData.out[0].lb2 && typeof appData.out[0].lb2 === 'string') {
                                    buf = Buffer.from(appData.out[0].lb2, 'base64');
                                    value = crypto.createHash('sha256').update(buf).digest('hex');
                                } else if (appData.out[0].b2 && typeof appData.out[0].b2 === 'string') {
                                    buf = Buffer.from(appData.out[0].b2, 'base64');
                                    value = crypto.createHash('sha256').update(buf).digest('hex');
                                } else {
                                    error = true
                                }
                                break;
                            case "b":
                                value = o.tx.h // D value = txid
                                break;
                            default:
                                error = true
                        }
                    }
                } else {
                    error = true
                }

            }
        }

        if (isProtocol && !error) {
            seq = parseSeq(Buffer.from(seq, 'hex').toString())
            key = Buffer.from(key, 'hex').toString()
            type = type.toLowerCase()

            let res = []
            for (let i = 0; i < senderAddresses.length; i++) {
                res.push({
                    blk: o.blk,
                    txid: o.tx.h,
                    sender: senderAddresses[i],
                    key: key,
                    value: value,
                    type: type,
                    seq: seq,
                    protocols: protocolType,
                })
            }
            return res

        } else if (error) {
            console.log("ERROR: senderAddresses:", senderAddresses, "key:", key, "value:", value, "type:", type, "seq:", seq, "txid:", o.tx.h, "validateKey:", validateKey(key), "validateValue:", validateValue(value), "validateType:", validateType(type))
        }
    } else {
        return null
    }
}

module.exports = {
    planaria: '0.0.1',
    from: 573500,
    name: 'D://',
    version: '0.0.11',
    description: 'Bitcoin dynamic content protocol',
    address: '1G3BpTyEK6xF4LaQTHqdFBBaVxYHZzts4M',
    index: {
        u: {
            keys: [
                'txid', 'sender', 'key', 'value', 'type', 'seq'
            ]
        },
        c: {
            keys: [
                'txid', 'sender', 'key', 'value', 'type', 'seq', 'blk.i', 'blk.t'
            ]
        },
        state: {
            keys: [
                'txid', 'sender', 'key', 'value', 'type', 'blk.i', 'blk.t'
            ]
        }
    },
    onmempool: async function(m) {
        //Get all Block D:// data
        let outputs = []
        let res = app(m.input)
        if (res) {
            for (let i = 0; i < res.length; i++) {
                outputs.push(res[i])
            }

            //Create Unconfirmed Mempool TXs
            await m.state.create({
                name: "u",
                data: outputs,
            }).catch(function(e) {
                if (e.code != 11000) {
                    console.log("# Error", e, m.input.block)
                    process.exit()
                }
            })

            //Publish Bitsocket
            m.output.publish({
                name: 'u',
                data: outputs
            })
        }
    },
    onblock: async function(m) {
        console.log("## onblock", "block height = ", m.input.block.info.height, "block hash =", m.input.block.info.hash, "txs =", m.input.block.info.tx.length)

        //Get all Block D:// data
        let blockOutputs = []
        await m.input.block.items.map(function(o) {
            let res = app(o)
            if (res) {
                for (let i = 0; i < res.length; i++) {
                    blockOutputs.push(res[i])
                }
            }
        })

        if (blockOutputs.length > 0) {
            /*
              Sort Outputs by:
                1. SEQUENCE Number in ascending order
                2. TXID in alphabetical and ascending order
            */
            blockOutputs.sort(function(obj1, obj2) {
                var o1 = obj1.txid.toLowerCase();
                var o2 = obj2.txid.toLowerCase();

                var p1 = obj1.seq;
                var p2 = obj2.seq;

                if (p1 < p2) return -1;
                if (p1 > p2) return 1;
                if (o1 < o2) return -1;
                if (o1 > o2) return 1;
                return 0;
            })

            console.log("[block] inserting", blockOutputs.length)

            //Insert all Block D:// data
            for (let i = 0; i < blockOutputs.length; i++) {
                let o = blockOutputs[i]
                console.log("OUTPUT: ", o)
                let state = await m.state.read({
                    name: "state",
                    filter: {
                        find: {
                            "key": o.key,
                            "sender": o.sender
                        }
                    }
                })
                if (state.length > 0) {
                  if (state[0].seq < o.seq ){
                    console.log("STATE: Update")
                    await updateState(m, o);
                  } else {
                    console.log("STATE: Sequence too low!")
                  }
                } else {
                    await createState(m, o);
                    console.log("STATE: Create")
                }
            }

            console.log("BLOCKOUTPUTS: ", blockOutputs)

            //Create Confirmed Block TXs for history
            await m.state.create({
                name: "c",
                data: blockOutputs,
            }).catch(function(e) {
                if (e.code != 11000) {
                    console.log("# Error", e, m.input.block)
                    process.exit()
                }
            })
        }

        //Get all Block-Mempool D:// data
        let mempoolOutputs = []
        await m.input.mempool.items.map(function(o) {
            let res = app(o)
            if (res) {
                for (let i = 0; i < res.length; i++) {
                    mempoolOutputs.push(res[i])
                }
            }
        })

        //Delete all Unconfirmed
        console.log("[block] resetting mempool")
        await m.state.delete({
            name: "u",
            filter: {
                find: {}
            }
        })

        if (mempoolOutputs.length > 0) {
            //Create Unconfirmed Block-Mempool
            console.log("Inserting", mempoolOutputs.length, "of", m.input.mempool.items.length)
            await m.state.create({
                name: "u",
                data: mempoolOutputs,
            }).catch(function(e) {
                if (e.code != 11000) {
                    console.log("# Error", e, m.input.block)
                    process.exit()
                }
            })
        }
    },
    onrestart: async function(m) {
        // Cleanup States according to machine height
        await m.state.delete({
            name: "state",
            filter: {
                find: {
                    "blk.i": {
                        $gt: m.clock.self.now
                    }
                }
            }
        }).catch(function(e) {
            if (e.code !== 11000) {
                console.log('## ERR ', e, m.clock.self.now, m.clock.bitcoin.now)
                process.exit()
            }
        })

        // Cleanup Confirmed according to machine height
        await m.state.delete({
            name: "c",
            filter: {
                find: {
                    "blk.i": {
                        $gt: m.clock.self.now
                    }
                }
            }
        }).catch(function(e) {
            if (e.code !== 11000) {
                console.log('## ERR ', e, m.clock.self.now, m.clock.bitcoin.now)
                process.exit()
            }
        })

        // Delete all Unconfirmed
        await m.state.delete({
            name: "u",
            filter: {
                find: {}
            }
        }).catch(function(e) {
            if (e.code !== 11000) {
                console.log('## ERR ', e, m.clock.self.now, m.clock.bitcoin.now)
                process.exit()
            }
        })
    }
}
