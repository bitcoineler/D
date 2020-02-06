var D_ = [
    "19iG3WTYSsbyos3uJ733yK4zEioi1FesNU",
    'alias.test',
    '7af41298ccb9f0013bdcb26bab5ea63b742cda2dfcabcc7d7001c7feefa77444',
    'c',
    '1'
];

// ee95e6c81552c0c0d6c36f07ee83fc73f2f8f17af39a54da2893c2f556907f2b
const datapay = require('datapay')

// xprv9s21ZrQH143K3xAPAyixWnWKAsipGzhYfDvoszsC6Wp9kd2hnLKsJXwNYUaxnwxTfK5gVJdH7qqjhA6qx5Vs7Unw31WkeUP7uWsyDXZV3iG
const privateKey = "Kxm1NWc1jhf6JV3s6aUDC2SuC5Meh4HcFAoZ3J3Lg4ardrpesHbG";
const bitcomAppID = "1PBEb5AAQVwK3dVetamqrybypS9SHJcE1H"

var config = {
  safe: true,
  data: D_,
  pay: {
    key: privateKey,
    rpc: "https://api.bitindex.network",
    feeb: 0.3,
    to: [{
      address: "1PBEb5AAQVwK3dVetamqrybypS9SHJcE1H",
      value: 1500
    }]
  }
}

datapay.build(config, function(error, tx) {
  console.log("Here's the transaction! : ", tx)
})
