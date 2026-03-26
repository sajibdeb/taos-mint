import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import * as dotenv from "dotenv";

dotenv.config();

// =============================================
// CONFIG — edit via .env file
// =============================================
const MNEMONIC = process.env.MNEMONIC || "";
const TICK = process.env.TICK || "";
const AMOUNT = process.env.AMOUNT || "";
const TOTAL_TX = parseInt(process.env.TOTAL_TX || "10", 10);
const DELAY_MS = parseInt(process.env.DELAY_MS || "500", 10);
const RPC_URL = process.env.RPC_URL || "wss://entrypoint-finney.opentensor.ai:443";
// Protocol fee address (Taoscriptions fee receiver) — required for inscriptions to be indexed
const FEE_RECEIVER = "5Fh7dSmMKVXT5YC7hsfCcHDg171xtQWBhppu66pxCqbvnnJC";
// Protocol fee per mint: 0.001 TAO = 1_000_000 rao
const PROTOCOL_FEE_RAO = 1_000_000;
// Minimum balance required before starting (gas + protocol fee buffer)
const MIN_BALANCE_TAO = 0.002;
// =============================================

const SEPARATOR = "=".repeat(60);

// Polkadot internal prefixes to suppress from console output
const POLKADOT_NOISE = ["REGISTRY", "API/INIT", "API-WS", "RPC-CORE", "VEC::", "DrandP"];

function suppressPolkadotNoise(): void {
    const originalWarn = console.warn.bind(console);
    const originalError = console.error.bind(console);
    const shouldSuppress = (args: any[]): boolean =>
        args.some((a) => typeof a === "string" && POLKADOT_NOISE.some((p) => a.includes(p)));
    console.warn = (...args: any[]) => { if (!shouldSuppress(args)) originalWarn(...args); };
    console.error = (...args: any[]) => { if (!shouldSuppress(args)) originalError(...args); };
}

function buildInscription(tick: string, amount: string): string {
    return JSON.stringify({ p: "tao-20", op: "mint", tick, amt: amount });
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatBalance(raw: bigint): string {
    const tao = Number(raw) / 1_000_000_000;
    return tao.toFixed(6) + " TAO";
}

function explorerLink(hash: string): string {
    return `https://taostats.io/extrinsic/${hash}`;
}

function isInsufficientFundsError(msg: string): boolean {
    return (
        msg.toLowerCase().includes("insufficient") ||
        msg.toLowerCase().includes("fund") ||
        msg.toLowerCase().includes("balance too low") ||
        msg.toLowerCase().includes("payment")
    );
}

async function mintForWallet(
    api: ApiPromise,
    mnemonic: string,
    walletIndex: number
): Promise<void> {
    const keyring = new Keyring({ type: "sr25519" });
    const account = keyring.addFromMnemonic(mnemonic.trim());
    const address = account.address;

    // Fetch balance
    const { data: balance } = await (api.query.system.account(address) as any);
    const free: bigint = BigInt(balance.free.toString());
    const freeFloat = Number(free) / 1_000_000_000;

    console.log(`\n${SEPARATOR}`);
    console.log(`  Wallet #${walletIndex + 1}`);
    console.log(`  Address : ${address}`);
    console.log(`  Balance : ${formatBalance(free)}`);
    console.log(`  Chain   : ${await api.rpc.system.chain()}`);
    console.log(`  Block   : #${(await api.rpc.chain.getHeader()).number.toNumber()}`);
    console.log(SEPARATOR);

    if (free === 0n) {
        console.log(`  ⚠️  Zero balance — skipping wallet #${walletIndex + 1}\n`);
        return;
    }

    if (freeFloat < MIN_BALANCE_TAO) {
        console.log(`  ⚠️  Balance too low (${formatBalance(free)} < ${MIN_BALANCE_TAO} TAO minimum) — skipping wallet #${walletIndex + 1}\n`);
        return;
    }

    const inscription = buildInscription(TICK, AMOUNT);
    console.log(`\n  Inscription : ${inscription}`);
    console.log(`  Minting ${TOTAL_TX} transactions...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < TOTAL_TX; i++) {
        // Re-check balance every 20 txs to catch depletion early
        if (i > 0 && i % 20 === 0) {
            const { data: freshBal } = await (api.query.system.account(address) as any);
            const freshFloat = Number(BigInt(freshBal.free.toString())) / 1_000_000_000;
            if (freshFloat < MIN_BALANCE_TAO) {
                console.log(`\n  ⚠️  Balance too low (${freshFloat.toFixed(6)} TAO) — stopping early at tx ${i + 1}/${TOTAL_TX}`);
                break;
            }
        }

        try {
            // Build batch: [transfer protocol fee] + [inscription remark]
            // This is the exact format taoscriptions.com uses — plain remark alone won't be indexed
            const batch = api.tx.utility.batchAll([
                api.tx.balances.transferKeepAlive(FEE_RECEIVER, PROTOCOL_FEE_RAO),
                api.tx.system.remark(inscription),
            ]);

            const blockHash = await new Promise<string>((resolve, reject) => {
                let unsub: () => void;
                batch
                    .signAndSend(account, ({ status, dispatchError }) => {
                        if (dispatchError) {
                            if (dispatchError.isModule) {
                                const decoded = api.registry.findMetaError(dispatchError.asModule);
                                reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`));
                            } else {
                                reject(new Error(dispatchError.toString()));
                            }
                            if (unsub) unsub();
                            return;
                        }
                        if (status.isInBlock || status.isFinalized) {
                            resolve(status.isInBlock
                                ? status.asInBlock.toHex()
                                : status.asFinalized.toHex()
                            );
                            if (unsub) unsub();
                        }
                    })
                    .then((u) => { unsub = u; })
                    .catch(reject);
            });

            successCount++;
            console.log(`  [${i + 1}/${TOTAL_TX}] ✅  ${explorerLink(blockHash)}`);
        } catch (err: any) {
            errorCount++;
            const msg: string = err.message || String(err);
            console.error(`  [${i + 1}/${TOTAL_TX}] ❌  ${msg}`);

            // Stop immediately on funds error
            if (isInsufficientFundsError(msg)) {
                console.log(`  ⛔  Insufficient funds — stopping.\n`);
                break;
            }
        }

        if (i < TOTAL_TX - 1) {
            await sleep(DELAY_MS);
        }
    }

    console.log(`\n  ✅  Wallet #${walletIndex + 1} done — ${successCount} minted, ${errorCount} failed\n`);
}

async function main(): Promise<void> {
    if (!MNEMONIC) {
        console.error("❌  ERROR: MNEMONIC is not set. Copy .env.example to .env and fill it in.");
        process.exit(1);
    }
    if (!TICK) {
        console.error("❌  ERROR: TICK is not set in .env");
        process.exit(1);
    }

    console.log(`\n${SEPARATOR}`);
    console.log("        TAOSCRIPTIONS — TAO-20 Inscription Minter");
    console.log(SEPARATOR);
    console.log(`  RPC     : ${RPC_URL}`);
    console.log(`  Tick    : ${TICK}`);
    console.log(`  Amount  : ${AMOUNT} per tx`);
    console.log(`  Txs     : ${TOTAL_TX} per wallet`);
    console.log(`  Delay   : ${DELAY_MS}ms between txs`);
    console.log(SEPARATOR);

    const mnemonics = MNEMONIC.split("|").filter((m) => m.trim().length > 0);
    console.log(`  Wallets : ${mnemonics.length}`);

    suppressPolkadotNoise();
    console.log(`\n  Connecting to ${RPC_URL} ...`);
    const provider = new WsProvider(RPC_URL);
    const api = await ApiPromise.create({ provider });
    await api.isReady;
    console.log("  ✅  Connected!\n");

    try {
        for (let i = 0; i < mnemonics.length; i++) {
            await mintForWallet(api, mnemonics[i], i);
        }
    } finally {
        await api.disconnect();
    }

    console.log(`\n${SEPARATOR}`);
    console.log("  =======> [ ALL DONE. CONGRATS! ] <=======");
    console.log(SEPARATOR);
}

main().catch((err) => {
    console.error("\n❌  Fatal error:", err.message || err);
    process.exit(1);
});
