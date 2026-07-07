# Asynchronous Data Sources

Channels are created from an asynchronous source:

- `Promise`
- `ReadableStream`
- `Observable` (`.subscribe()`)
- `AsyncGenerator`
- `ServiceProvider`
- custom adapter

Keep in mind that if the async source already has transform capabilities, e.g. RxJS, there is the option to use it directly to create channels without this library.