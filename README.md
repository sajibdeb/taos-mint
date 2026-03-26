# Taoscriptions TAO-20 Inscription Minter Bot

Auto-mint TAO-20 inscriptions on the [Bittensor](https://bittensor.com) blockchain — the same transactions triggered by [taoscriptions.com/mint](https://www.taoscriptions.com/mint).

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

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your `.env`

Copy the example file:

```bash
copy .env.example .env
```

Open `.env` and fill in your values:

```env
MNEMONIC=your twelve or twenty four word mnemonic phrase here

TICK=TSCR          # TAO-20 token tick to mint
AMOUNT=1000        # Amount per mint transaction
TOTAL_TX=10        # Number of mint transactions
DELAY_MS=1000      # Delay between txs in milliseconds
RPC_URL=wss://entrypoint-finney.opentensor.ai:443
```

### 3. Run the bot

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
