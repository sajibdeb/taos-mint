# Taoscriptions TAO-20 Inscription Minter Bot

Auto-mint TAO-20 inscriptions on the [Bittensor](https://bittensor.com) blockchain — the same transactions triggered by [taoscriptions.com/mint](https://www.taoscriptions.com/mint).

#
******************************************

Follow me on X: https://x.com/SajibDeb_bd

******************************************

## You need:
### 1. Bittensor (TAO) wallet.
How to Get Started: 
Go to the official website: https://talisman.xyz/
Click Download Wallet and add the extension to your browser (Chrome or Firefox recommended).
Set a strong password for the extension.
Choose:Create new wallet → It will give you a 12 or 24-word recovery phrase (backup this securely offline!).
Or Import an existing wallet using your seed phrase.
Or connect a hardware wallet.

### 2. Fund your wallet -- 0.001 TAOS per mint + gas fees --
1. Use CEX like Binance or others and deposit TAO directly to your wallet!
2. Bridge: https://www.tao.app/bridge (Buy vTAO on Base network. CA: "0xe9f6d9898f9269b519e1435e6ebaff766c7f46bf". Bridge to TAO(EVM network first), then bridge from EVM to TAO (subnet Talisman wallet)


## How It Works

Each "mint" submits a signed `system.remark` extrinsic containing a TAO-20 JSON payload:

```json
{"p":"tao-20","op":"mint","tick":"TAOS","amt":"420"}
```

This permanently inscribes the data on the Bittensor L1 chain, exactly as the Taoscriptions website does.

---

## Requirements

- [Node.js v18+](https://nodejs.org) and npm
- A Bittensor wallet with TAO (for gas fees)
- The token **tick** you want to mint

---

## Setup
### 1. Get the App
Download the Code file and extract on your PC or clone to your PC: ```git clone https://github.com/sajibdeb/taos-mint.git```
Open the folder and in the folder > right click > open in terminal

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your `.env`

Copy the example file:

```bash
copy .env.example .env
```

Open `.env` and fill in your values:

```env
MNEMONIC=your twelve or twenty four word mnemonic phrase here

TICK=TAOS          # TAO-20 token tick to mint
AMOUNT=420        # Amount per mint transaction
TOTAL_TX=10        # Number of mint transactions
DELAY_MS=1000      # Delay between txs in milliseconds
RPC_URL=wss://entrypoint-finney.opentensor.ai:443
```

### 4. Run the bot

```bash
npm start
```

---

## Multi-Wallet Support

Separate multiple mnemonics with a pipe `|` in your `.env`:

```env
MNEMONIC=wallet one mnemonic words here|wallet two mnemonic words here
```

The bot will process each wallet sequentially.

---

## Output Example

```
============================================================
        TAOSCRIPTIONS — TAO-20 Inscription Minter
============================================================
  RPC     : wss://entrypoint-finney.opentensor.ai:443
  Tick    : TSCR
  Amount  : 1000 per tx
  Txs     : 10 per wallet
  Delay   : 1000ms between txs
============================================================
  Wallets : 1

  Connecting to wss://entrypoint-finney.opentensor.ai:443 ...
  ✅  Connected!

============================================================
  Wallet #1
  Address : 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
  Balance : 1.234567 TAO
  Chain   : Bittensor
  Block   : #3456789
============================================================

  Inscription : {"p":"tao-20","op":"mint","tick":"TSCR","amt":"1000"}
  Minting 10 transactions...

  [1/10] ✅  In Block  | https://taostats.io/extrinsic/0xabc...
  [2/10] ✅  In Block  | https://taostats.io/extrinsic/0xdef...
  ...

  ✅  Done for wallet #1

============================================================
  =======> [ ALL DONE. CONGRATS! ] <=======
============================================================
```

---

## Verify Your Inscriptions

- **Explorer**: [taostats.io](https://taostats.io) — search your address or tx hash
- **Taoscriptions**: [taoscriptions.com/explorer](https://www.taoscriptions.com/explorer.html) — view your inscriptions

---

## Notes

- Each transaction costs a small TAO gas fee (~0.00001 TAO)
- Test with `TOTAL_TX=1` first to confirm everything works
- `DELAY_MS` is recommended to avoid nonce collisions (keep ≥ 1000ms)
