# D://
_Bitcoin dynamic content protocol_

## Benefit
A D:// transaction refers to another transaction/file and thus forms a layer which state can be overwritten. This way, referencing content via D:// links (instead of b:// or c://) has the advantage of keeping the URL while the content can change.

Example B:// (**can not** be changed once set):<br> ``<img src="B://<TxID>"``

Example D:// (content **can** be changed, because the state can be updated):<br> ``<img src="D://<OwnerBitcoinAddress>/<key>"``

#### Overwrite D:// State
New transactions with the same `key` from a sender overwrite the previous state. The Planaria API always outputs only the most current state.
The owner/key combination prevents an unauthorised person from changing the state.


## Protocol

- The prefix for D is [19iG3WTYSsbyos3uJ733yK4zEioi1FesNU](https://genesis.bitdb.network/query/1FnauZ9aUH2Bex6JzdcV4eNX7oLSSEbxtN/ewogICJ2IjogMywKICAicSI6IHsKICAgICJmaW5kIjogewogICAgICAiaW4uZS5hIjogIjE5aUczV1RZU3NieW9zM3VKNzMzeUs0ekVpb2kxRmVzTlUiLAogICAgICAib3V0LnMxIjogIiQiCiAgICB9LAogICAgInNvcnQiOiB7CiAgICAgICJ0aW1lc3RhbXAiOiAxCiAgICB9LAogICAgImxpbWl0IjogMTAKICB9Cn0=), generated using [Bitcom](https://bitcom.bitdb.network)

The sender of the transaction will alway be an "owner" of the state = first input address will be able to change the state again.

D:// transactions comes in 2 variants. 

### External reference
A D:// transaction with external reference is formatted like:

```
OP_RETURN
  19iG3WTYSsbyos3uJ733yK4zEioi1FesNu
  [key]
  [value]
  [type]
  [sequence]
```

*  `key`: NULL or a utf8 encoded string no longer than 1024 chars __not__ starting with `/` and not including the chars `[\x00-\x1F\x7F?#]`. It is suggested to simulate a folder like structure in a URI styled manner. Even if (almost) all utf8 chars are allowed it is not to be considered an [IRI](https://en.wikipedia.org/wiki/Internationalized_Resource_Identifier) and `key` must be url-escaped to become a valid [URI](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier) whenever presented to a user. Only using `[a-zA-Z0-9_~/@!$&*+,.:;=-]` is therefore advisable.

*  `value`: NULL, a string with the hex value of the txid of a b://, a string with the hex value of the hash of a c:// or a utf8 encoded string no onger than 2086 chars.

*  `type`: NULL, the string `c` or `b` indicating the nature of a the content in the value field or the text "txt" to indicate that the value field contains the actual content.

*  `sequence`: Integer larger than 0 and smaller than 2^53-1. Everything that is not a number or a negative number is considered to be `1`. Used to indicate the order of events if multiple updates are provided in the same block to the same key from the same owner. 

Please note that value and type must be both NULL or both a string for it to be a valid change of state. 

### Internal reference
A D:// transaction with internal reference is piped directly on to a B:// formatted structure (with mandatory fields for encoding and filename):

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

Both transactions with internal and external references can add an explicit owner by piping the [AIP protocol](https://github.com/BitcoinFiles/AUTHOR_IDENTITY_PROTOCOL) that signs all previus fields (API_ALL). 

Example A:

```
OP_RETURN
  19iG3WTYSsbyos3uJ733yK4zEioi1FesNu
  [key]
  [value]
  [type]
  [sequence]
  |
  15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva
  [Signing Algorithm]
  [Signing Address]
  [Signature]
```

Example B:

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

If a transaction includes a valid AIP signature and the signature involves all previous fields (AIP_ALL) both the sender and AIP signing address will create an update to the key. Effectively this means that you will be able to access the content with both `D://<tx sender address>/<key>` and `D://<AIP signing address>/<key>`.


### Delete

A key is "removed" by updating the key with a reference set to NULL (`0x00`). The state of the planaria will provide the string `deleted` as "type" when a key is removed. 

Example: 

```
OP_RETURN
  19iG3WTYSsbyos3uJ733yK4zEioi1FesNu
  [key]
  NULL
  NULL
  1
```

#### Example Tx
This is an example Website with D:// link in it: https://bico.media/0363e9addc3f5de6587b250a07c4bab00f58f54cf780aa5f0f4655a8d3e4cfa5

This should map <img src="D://19iG3WTYSsbyos3uJ733yK4zEioi1FesNU/der_wolf_und_die_sieben_geislein.jpeg"> ==> C://c808b8aa7bf72a0732d1a366d530b6ad3cdea1f25cbe075ca075dc1f55006e5e ==> B://efb301edd3a8b2270aea61cdc46bd923130a8c05245f763ff3c3c8fea1f0fc27


State machine D:// tx:  https://whatsonchain.com/tx/329eacb2d1ab8770ac01d2daa13a852d72282379ea26caca1729817315fb12b0

State machine Query: https://d.onchain.ch/query/1G3BpTyEK6xF4LaQTHqdFBBaVxYHZzts4M/ewogICJ2IjogMywKICAicSI6IHsKICAgICJmaW5kIjogewogICAgICAic2VuZGVyIjoiMTlpRzNXVFlTc2J5b3MzdUo3MzN5SzR6RWlvaTFGZXNOVSIsCiAgICAgICJhbGlhcyI6ImRlcl93b2xmX3VuZF9kaWVfc2llYmVuX2dlaXNsZWluLmpwZWciCiAgICB9LAogICAgImxpbWl0IjogMTAwCiAgfSwKICAiciI6IHsKICAgICJmIjogIlsuW10gfCB7IHRyYW5zYWN0aW9uOiAudHhpZCwgYmxvY2s6IC5ibGsuaSwgc2VuZGVyOiAuc2VuZGVyICwgYWxpYXM6IC5hbGlhcywgcG9pbnRlcjogLnBvaW50ZXIsY250OiAuY250LCB0eXBlOiAudHlwZSAsIHNlcTogLnNlcSAsIFwiVVJJIG92ZXIgaHR0cHNcIjogKGlmIC50eXBlID09IFwiY1wiIHRoZW4gXCJodHRwczovL2RhdGEuYml0ZGIubmV0d29yay8xS3VVcjJwU0pEYW85N1hNOEpzcTh6d0xTNlcxV3RGZkxnL2MvXFwoLnBvaW50ZXIpXCIgZWxzZSBcImh0dHBzOi8vYi5iaXRkYi5uZXR3b3JrI1xcKC5wb2ludGVyKVwiIGVuZCl9XSIKICB9Cn0=


## Referencing

A D:// transaction is referenced by `D://<OwnerBitcoinAddress>/<key>`

- Key must always be presented as a URL encoded string

- In case the key is NULL no key is to be provided

- In case no key is provided the `/` is optional

- In case no key is provided, the content will tentatively be derived from the first of the following keys with a none deleted d:// transaction:
  1. The key of `NULL` value (`0x00`)
  2. The key `index.html` 
  2. The key `index.htm` 





## Links

D:// Transactions:<br> https://babel.bitdb.network/query/1DHDifPvtPgKFPZMRSxmVHhiPvFmxZwbfh/ewogICJ2IjogMywKICAicSI6IHsKICAgICJmaW5kIjogewogICAgICAib3V0LnMxIjogIjE5aUczV1RZU3NieW9zM3VKNzMzeUs0ekVpb2kxRmVzTlUiCiAgICB9LAogICAgImxpbWl0IjogMTAwCiAgfSwKICAiciI6IHsKICAgICJmIjogIlsuW10gfCB7IHRyYW5zYWN0aW9uOiAudHguaCwgYmxvY2s6IC5ibGssIHNlbmRlcjogLmluWzBdLmUuYSAsYXBwSUQ6IC5vdXRbMF0uczEsIGFsaWFzOiAub3V0WzBdLnMyLCBwb2ludGVyOiAub3V0WzBdLnMzLCB0eXBlOiAub3V0WzBdLnM0ICwgc2VxOiAub3V0WzBdLnM1ICxcIlVSSSBvdmVyIGh0dHBcIjogXCJodHRwczovL2RhdGEuYml0ZGIubmV0d29yay8xS3VVcjJwU0pEYW85N1hNOEpzcTh6d0xTNlcxV3RGZkxnL1xcKC5vdXRbMF0uczQpXC9cXCgub3V0WzBdLnMzKVwifV0iCiAgfQp9

D:// State Machine:<br>
https://d.onchain.ch/query/1G3BpTyEK6xF4LaQTHqdFBBaVxYHZzts4M


#### ...
* An API that resolves D:// links to txids or an API that returns even the file data can be built.
* Get a list of "files" in a directory (find all current tx with a key that starts with `xyz/` for a specific owner)
* Multiple signatures to share control. 
* X out of N signatures to share control.
