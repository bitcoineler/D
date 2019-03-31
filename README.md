# D://
_Bitcoin dynamic name protocol_




## Benefit
A D:// transaction refers to another transaction/file and thus forms a layer which state can be overwritten. This way, referencing content via D:// links (instead of b:// or c://) has the advantage of keeping the URL while the content can change.

Example B:// (**can not be changed** once set):<br>
``<img src="B://<TxID(1)>"``

Example D:// (Pointer **can be changed**, because the state of the entry can be overwritten.):<br>  
``<img src="D://<OwnerBitcoinAddress>/<key>"``


#### Overwrite D:// State
New transactions with the same `key` from a sender automatically override the old state. Protocol API always outputs only the most current state
The owner/key combination prevents an unauthorised person from changing the state.


## Protocol

- The prefix for D is [19iG3WTYSsbyos3uJ733yK4zEioi1FesNU](https://genesis.bitdb.network/query/1FnauZ9aUH2Bex6JzdcV4eNX7oLSSEbxtN/ewogICJ2IjogMywKICAicSI6IHsKICAgICJmaW5kIjogewogICAgICAiaW4uZS5hIjogIjE5aUczV1RZU3NieW9zM3VKNzMzeUs0ekVpb2kxRmVzTlUiLAogICAgICAib3V0LnMxIjogIiQiCiAgICB9LAogICAgInNvcnQiOiB7CiAgICAgICJ0aW1lc3RhbXAiOiAxCiAgICB9LAogICAgImxpbWl0IjogMTAKICB9Cn0=), generated using [Bitcom](https://bitcom.bitdb.network)

The owner of the transaction is the "sender" of the transaction = first input address.

D:// transactions comes in 2 variants. 

### External reference
A D:// transaction with external reference is formatted like:

```
OP_RETURN
  19iG3WTYSsbyos3uJ733yK4zEioi1FesNu
  [key]
  [pointer]
  [type]
  [sequence]
```

*  `key`: a utf8 encoded string no longer than 1024 chars __not__ starting with `/` and not including the control chars `[\x00-\x1F\x7F]`. It is suggested to simulate a folder like structure. Even if all utf8 chars are allowed it is advised to consider, that normal day usage will involve a URL escaped version presented to the user. Only using `[a-zA-Z0-9_~/@!$&*+,.:;=-]` is therefore advisable.

*  `pointer`: string with txid of b:// or hash of a c://

*  `type`: The string `c` or `b` indicating the type of pointer

*  `sequence`: Integer larger than 0 and smaller than 2^53-1. Everything that is not a number or a negative number is considered to be `1`. Only used to indicate the order of events if multiple updates are provided in the same block to the same key from the same owner. 





### Internal reference
A D:// transaction with internal reference is piped directly on to a B:// formatted structure with mandatory fields for encoding and filename:

```
OP_RETURN
  19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut
  [DATA]
  [MEDIA TYPE]
  [ENCODING] or NULL
  [FILENAME] or NULL
  |
  19iG3WTYSsbyos3uJ733yK4zEioi1FesNu
  [key]
  NULL
  NULL
  [sequence]
```






### Explicit owner

Both transactions with internal and external references can have the owner explicitly provided by piping the AIP protocol after the demonstrated fields (see https://github.com/BitcoinFiles/AUTHOR_IDENTITY_PROTOCOL). 


```
OP_RETURN
  19iG3WTYSsbyos3uJ733yK4zEioi1FesNu
  [key]
  [pointer]
  [type]
  [sequence]
  |
  15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva
  [Signing Algorithm]
  [Signing Address]
  [Signature]
```



```
OP_RETURN
  19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut
  [DATA]
  [MEDIA TYPE]
  [ENCODING] or NULL
  [FILENAME] or NULL
  |
  19iG3WTYSsbyos3uJ733yK4zEioi1FesNu
  [key]
  NULL
  NULL
  [sequence]
  |
  15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva
  [Signing Algorithm]
  [Signing Address]
  [Signature]
```

If a transaction includes a valid AIP signature and the signature involves all previous fields (AIP_ALL) it is not the sender but the signing address that will be considered the owner in the transaction. 


#### Example Tx
This is an example Website with D:// link in it: https://bico.media/0363e9addc3f5de6587b250a07c4bab00f58f54cf780aa5f0f4655a8d3e4cfa5

This should map <img src="D://19iG3WTYSsbyos3uJ733yK4zEioi1FesNU/der_wolf_und_die_sieben_geislein.jpeg"> ==> C://c808b8aa7bf72a0732d1a366d530b6ad3cdea1f25cbe075ca075dc1f55006e5e ==> B://efb301edd3a8b2270aea61cdc46bd923130a8c05245f763ff3c3c8fea1f0fc27


State machine D:// tx:  https://whatsonchain.com/tx/329eacb2d1ab8770ac01d2daa13a852d72282379ea26caca1729817315fb12b0

State machine Query: https://d.onchain.ch/query/1G3BpTyEK6xF4LaQTHqdFBBaVxYHZzts4M/ewogICJ2IjogMywKICAicSI6IHsKICAgICJmaW5kIjogewogICAgICAic2VuZGVyIjoiMTlpRzNXVFlTc2J5b3MzdUo3MzN5SzR6RWlvaTFGZXNOVSIsCiAgICAgICJhbGlhcyI6ImRlcl93b2xmX3VuZF9kaWVfc2llYmVuX2dlaXNsZWluLmpwZWciCiAgICB9LAogICAgImxpbWl0IjogMTAwCiAgfSwKICAiciI6IHsKICAgICJmIjogIlsuW10gfCB7IHRyYW5zYWN0aW9uOiAudHhpZCwgYmxvY2s6IC5ibGsuaSwgc2VuZGVyOiAuc2VuZGVyICwgYWxpYXM6IC5hbGlhcywgcG9pbnRlcjogLnBvaW50ZXIsY250OiAuY250LCB0eXBlOiAudHlwZSAsIHNlcTogLnNlcSAsIFwiVVJJIG92ZXIgaHR0cHNcIjogKGlmIC50eXBlID09IFwiY1wiIHRoZW4gXCJodHRwczovL2RhdGEuYml0ZGIubmV0d29yay8xS3VVcjJwU0pEYW85N1hNOEpzcTh6d0xTNlcxV3RGZkxnL2MvXFwoLnBvaW50ZXIpXCIgZWxzZSBcImh0dHBzOi8vYi5iaXRkYi5uZXR3b3JrI1xcKC5wb2ludGVyKVwiIGVuZCl9XSIKICB9Cn0=


## Links

D:// Transactions:<br> https://babel.bitdb.network/query/1DHDifPvtPgKFPZMRSxmVHhiPvFmxZwbfh/ewogICJ2IjogMywKICAicSI6IHsKICAgICJmaW5kIjogewogICAgICAib3V0LnMxIjogIjE5aUczV1RZU3NieW9zM3VKNzMzeUs0ekVpb2kxRmVzTlUiCiAgICB9LAogICAgImxpbWl0IjogMTAwCiAgfSwKICAiciI6IHsKICAgICJmIjogIlsuW10gfCB7IHRyYW5zYWN0aW9uOiAudHguaCwgYmxvY2s6IC5ibGssIHNlbmRlcjogLmluWzBdLmUuYSAsYXBwSUQ6IC5vdXRbMF0uczEsIGFsaWFzOiAub3V0WzBdLnMyLCBwb2ludGVyOiAub3V0WzBdLnMzLCB0eXBlOiAub3V0WzBdLnM0ICwgc2VxOiAub3V0WzBdLnM1ICxcIlVSSSBvdmVyIGh0dHBcIjogXCJodHRwczovL2RhdGEuYml0ZGIubmV0d29yay8xS3VVcjJwU0pEYW85N1hNOEpzcTh6d0xTNlcxV3RGZkxnL1xcKC5vdXRbMF0uczQpXC9cXCgub3V0WzBdLnMzKVwifV0iCiAgfQp9

D:// State Machine:<br>
https://d.onchain.ch/query/1G3BpTyEK6xF4LaQTHqdFBBaVxYHZzts4M


#### ...
* An API that resolves D:// links to txids or an API that returns even the file data can be built.
* State reset/delete actions
* Delete file (set content to null?)
* Get a list of "files" in a directory (find all current tx with a key that starts with `xyz/` for a specific owner)
