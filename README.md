# js libp2p pstn stats

Statistics for benchmarking libp2p pubsub implementations.

**Currently in development**

## Install

To install through npm:

```sh
> npm i libp2p-pstn-stats --save
```

## Example

`libp2p-pstn-stats` is built to work with [this early implementation of libp2p pubsub](https://github.com/libp2p/js-libp2p-floodsub) and [the `libp2p-pstn-logger` proxy logger](https://github.com/gavinmcdermott/js-libp2p-pstn-logger/). 


It generates propagation benchmark stats for the network by consuming the output log file specified by the above modules using this [`debug` module](https://github.com/visionmedia/debug).

The namespace it consumes is currently `pstn:logger`, but a standard naming convention will emerge soon.

## Tests

To run the tests:

`> npm test`

## Contribute

PRs are welcome!

## License

MIT © Gavin McDermott
