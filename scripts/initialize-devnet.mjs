#!/usr/bin/env node

import fs from "node:fs";
import * as anchor from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const owner = new PublicKey(
  process.env.PROJECT_AUTHORITY ??
    "8QrEi46qwx1hxZBa9RGvxh4FrAK2rsG6BmRT1xV9qMWg",
);

const custodyId = new PublicKey(process.env.QUANTUM_CUSTODY_PROGRAM_ID);
const tokenProgramId = new PublicKey(process.env.SPQC_TOKEN_PROGRAM_ID);

const custodyIdl = JSON.parse(
  fs.readFileSync("target/idl/quantum_custody.json", "utf8"),
);
const tokenIdl = JSON.parse(
  fs.readFileSync("target/idl/solana_pqc_token.json", "utf8"),
);

const custody = new anchor.Program(custodyIdl, custodyId, provider);
const token = new anchor.Program(tokenIdl, tokenProgramId, provider);

const [globalState] = PublicKey.findProgramAddressSync(
  [Buffer.from("global")],
  custodyId,
);

const custodySignature = await custody.methods
  .initialize(owner)
  .accounts({
    globalState,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

const mint = Keypair.generate();
const [tokenInfo] = PublicKey.findProgramAddressSync(
  [Buffer.from("token-info"), mint.publicKey.toBuffer()],
  tokenProgramId,
);

const tokenSignature = await token.methods
  .initializeToken(
    "SCSTOBCMinority AI",
    "SPQC",
    "https://github.com/elon00/solana-pqc",
  )
  .accounts({
    mint: mint.publicKey,
    tokenInfo,
    payer: provider.wallet.publicKey,
    mintAuthority: owner,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .signers([mint])
  .rpc();

console.log(`PROJECT_AUTHORITY=${owner.toBase58()}`);
console.log(`QUANTUM_CUSTODY_GLOBAL_STATE=${globalState.toBase58()}`);
console.log(`SPQC_MINT=${mint.publicKey.toBase58()}`);
console.log(`SPQC_TOKEN_INFO=${tokenInfo.toBase58()}`);
console.log(`CUSTODY_INITIALIZE_SIGNATURE=${custodySignature}`);
console.log(`TOKEN_INITIALIZE_SIGNATURE=${tokenSignature}`);
