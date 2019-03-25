# D://
Bitcoin dynamic name protocol

## Links

D:// Transactions:<br> https://babel.bitdb.network/query/1DHDifPvtPgKFPZMRSxmVHhiPvFmxZwbfh/ewogICJ2IjogMywKICAicSI6IHsKICAgICJmaW5kIjogewogICAgICAib3V0LnMxIjogIjE5aUczV1RZU3NieW9zM3VKNzMzeUs0ekVpb2kxRmVzTlUiCiAgICB9LAogICAgImxpbWl0IjogMTAwCiAgfSwKICAiciI6IHsKICAgICJmIjogIlsuW10gfCB7IHRyYW5zYWN0aW9uOiAudHguaCwgYmxvY2s6IC5ibGssIHNlbmRlcjogLmluWzBdLmUuYSAsYXBwSUQ6IC5vdXRbMF0uczEsIGFsaWFzOiAub3V0WzBdLnMyLCBwb2ludGVyOiAub3V0WzBdLnMzLCB0eXBlOiAub3V0WzBdLnM0ICwgc2VxOiAub3V0WzBdLnM1ICxcIlVSSSBvdmVyIGh0dHBcIjogXCJodHRwczovL2RhdGEuYml0ZGIubmV0d29yay8xS3VVcjJwU0pEYW85N1hNOEpzcTh6d0xTNlcxV3RGZkxnL1xcKC5vdXRbMF0uczQpXC9cXCgub3V0WzBdLnMzKVwifV0iCiAgfQp9

D:// State Machine:<br>
https://bn.onchain.ch/query/1G3BpTyEK6xF4LaQTHqdFBBaVxYHZzts4M

## Benefit
**D://** insteed of **B://** Links could be included in websites. Using bn: // links instead of b: // links has the advantage of being able to dynamically include content.

Example B:// (**can not be changed** once set):<br>
``<img src="B://<TxID(1)>"``

Example D:// (Pointer **can be changed**, because the state of the entry can be overwritten.):<br>  
``<img src="D://<BitcoinAddress>/<alias>"``

## Protocol

- The prefix for D is [19iG3WTYSsbyos3uJ733yK4zEioi1FesNU](https://genesis.bitdb.network/query/1FnauZ9aUH2Bex6JzdcV4eNX7oLSSEbxtN/ewogICJ2IjogMywKICAicSI6IHsKICAgICJmaW5kIjogewogICAgICAiaW4uZS5hIjogIjE5aUczV1RZU3NieW9zM3VKNzMzeUs0ekVpb2kxRmVzTlUiLAogICAgICAib3V0LnMxIjogIiQiCiAgICB9LAogICAgInNvcnQiOiB7CiAgICAgICJ0aW1lc3RhbXAiOiAxCiAgICB9LAogICAgImxpbWl0IjogMTAKICB9Cn0=), generated using [Bitcom](https://bitcom.bitdb.network)

The D: // protocol should point to the TxID e.g. of a B: // file and thus forms another layer which state can be overwritten.

=> Im not sure if it makes sense to add a type field !?
=> possible types could be: txid-pointer, folder-pointer, ?

Here's an example of what **D transactions** look like:

```
OP_RETURN
  19iG3WTYSsbyos3uJ733yK4zEioi1FesNU
  [alias]
  [pointer]
  [type]
  [sequence]
```

*  alias: name,filename,alias
*  pointer: txid of b:// or c://
*  type: 'c' or 'b'
*  sequence: only needed if multiple tx(update) in same block. sequence is a number, higher number tx overwrites the lower one. everything what is not number is translated to 1.


#### Overwrite D:// State
New transactions with the same alias from a sender automatically override the old state. Protocol API always outputs only the most current state.
The alias sender combination prevents an unauthorized one from changing state.

#### ...
*  An API that resolves D: // links to txids or an API that returns even the file data can be built.
*  maybe add a type field to simulate something like directories.
*  state reset/delete actions
