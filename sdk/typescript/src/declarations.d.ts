declare module '@coral-xyz/anchor' {
  export class Program<T = any> {
    constructor(idl: any, programId: any, provider?: any);
    programId: any;
    methods: any;
    account: any;
  }
  export class AnchorProvider {
    constructor(connection: any, wallet: any, opts: any);
    connection: any;
    wallet: any;
  }
  export type Idl = any;
}

declare module 'bn.js' {
  export default class BN {
    constructor(n: number | string | number[] | Uint8Array | Buffer, base?: number | 'hex', endian?: 'le' | 'be');
    toNumber(): number;
    toString(base?: number | 'hex'): string;
  }
}
