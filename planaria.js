/***************************************
*
* API Reference: https://docs.planaria.network/#/api?id=anatomy-of-a-planaria
*
***************************************/
// App-Addresses
const bitcomD = "19iG3WTYSsbyos3uJ733yK4zEioi1FesNU"

var updateState = async function(m,o) {
  await m.state.update({
   name: "state",
   filter: {
     find: {
       "alias": o.alias,
       "sender": o.sender
     }
   },
   map: function(item) {
     ++item.cnt
     item.blk = o.blk
     item.txid = o.txid
     item.pointer = o.pointer
     item.type = o.type
     item.seq = o.seq

     //Publish - Bitsocket
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

var createState = async function(m,o) {
  o.cnt = 1
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

//D
var D = function(o) {
  let outputs = []
  let isdata = false
  for(let i=0; i<o.out.length; i++) {
    if (o.out[i].b0 && o.out[i].b0.op && o.out[i].b0.op === 106 && o.out[i].s1 == bitcomD && o.out[i].s2 && o.out[i].s3 && o.out[i].s4 && o.out[i].s5) {
      isdata = true
      let seq = o.out[i].s5
      let data = o.out[i]
      if(isNaN(seq)){
        data.s5 = 1
      }
      outputs.push(data)
    }
  }
  if (isdata) {
    return {
      tx: {h: o.tx.h},
      in: o.in.map(function(i) {
        return { e: { a: i.e.a } }
      }),
      out: outputs
    }
  } else {
    return null
  }
}

module.exports = {
  planaria: '0.0.1',
  from: 573500,
  name: 'D://',
  version: '0.0.1',
  description: 'Bitcoin dynamic name protocol',
  address: '1G3BpTyEK6xF4LaQTHqdFBBaVxYHZzts4M',
  index: {
    u: {
      keys: [
	       'txid','sender','alias','pointer','type','seq'
      ]
    },
    state: {
      keys: [
	       'txid','sender','alias','pointer','type','seq'
      ]
    }
  },
  onmempool: async function(m) {
    let appData = D(m.input)
      if (appData) {
        let output = {
          txid: m.input.tx.h,
          sender: appData.in[0].e.a,
          alias: appData.out[0].s2,
          pointer: appData.out[0].s3,
          type: appData.out[0].s4,
	  seq: appData.out[0].s5,
        }
        await m.state.create({
         name: "u",
         data: output,
        }).catch(function(e) {
         if (e.code !== 11000) {
           console.log("# Error", e, m.input.block)
           process.exit()
         }
        })

        //Publish Bitsocket
        m.output.publish({
          name: 'u',
          data: output
        })
      }
  },
  onblock: async function(m) {
    console.log("## onblock", "block height = ", m.input.block.info.height, "block hash =", m.input.block.info.hash, "txs =", m.input.block.info.tx.length)
    let outputs = m.input.block.items.map(function(o) {
      let appData = D(o)
      if (appData) {
        return {
          blk: o.blk,
          txid: o.tx.h,
          sender: appData.in[0].e.a,
          alias: appData.out[0].s2,
          pointer: appData.out[0].s3,
          type: appData.out[0].s4,
	        seq: appData.out[0].s5,
        }
      } else {
        return null
      }
    }).filter(function(o) {
      return o
    })

    //SORT OUTPUTS by SEQUENCE
    outputs.sort(function(x,y){return x.seq - y.seq})

    console.log("[block] inserting", outputs.length)

   //BLOCK TXs
   for (let i=0; i<outputs.length; i++) {
     let o = outputs[i]
     let state = await m.state.read({
       name: "state",
       filter: {
         find: {
           "alias" : o.alias,
           "sender" : o.sender
         }
       }
      })
      if(state.length > 0){
        await updateState(m,o);
      } else {
        await createState(m,o);
      }
   }

    //MEMPOOL TXs
    console.log("[block] resetting mempool")
    let txs = m.input.mempool.items.map(function(o) {
      let appData = D(o)
      if (appData) {
        return {
          txid: o.tx.h,
          sender: appData.in[0].e.a,
          alias: appData.out[0].s2,
          pointer: appData.out[0].s3,
          type: appData.out[0].s4,
	  seq: appData.out[0].s5,
        }
      } else {
        return null
      }
    }).filter(function(o) {
      return o
    })

    console.log("Inserting", txs.length, "of", m.input.mempool.items.length)

    await m.state.delete({ name: "u", filter: { find: {} } })
    await m.state.create({ name: "u", data: txs, }).catch(function(e) {
      if (e.code != 11000) {
        console.log("# Error", e, m.input.block)
        process.exit()
      }
    })
  },
  onrestart: async function(m) {
    await m.state.delete({
      name: "state",
      filter: {
        find: {
          "blk.i": { $gt: m.clock.self.now }
        }
      }
    }).catch(function(e) {
      if (e.code !== 11000) {
        console.log('## ERR ', e, m.clock.self.now, m.clock.bitcoin.now)
        process.exit()
      }
    })

    await m.state.delete({
      name: "u",
      filter: {
        find: {
          "blk.i": { $gt: m.clock.self.now }
        }
      }
    }).catch(function(e) {
      if (e.code !== 11000) {
        console.log('## ERR ', e, m.clock.self.now, m.clock.bitcoin.now)
        process.exit()
      }
    })
  }
}
