# Create Channels with `use` 

Possible outputs:

outputs/inputs | Promise | 
Channel(s)
dispatch input signal to 

```jsx
const [Channel1, Channel2, dispatch] = fan(...channelFn, options);
const [Channel1, Channel2] = use(dataProvider, ...channelFn, options)

```
Depending on the inputs and options

An Output Channel is a processing pipeline from asynchronous inputs to channel outputs _and_ actions. 

Output channels do not interface directly with the async data provider, they only receive responses as input.



The `use` function sets up a distributary channel connected to the asynchronous data provider and may also be providing input to 
other individual Output Channels.


channels created by `use` are composition of two different types of chanel


A 
