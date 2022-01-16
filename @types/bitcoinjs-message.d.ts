declare module 'bitcoinjs-message' {
    var magicHash: (message: string, messagePrefix: string) => Buffer;
    var sign: (message: string, privateKey: string, compressed: boolean, messagePrefix?: string) => Buffer;
    var verify: (message: string, address: string, signature: string, messagePrefix?: string) => boolean;
   export = {
    magicHash: magicHash,
    sign: sign,
    verify: verify
   }
}