#!/usr/bin/env bash
# L1 Avalanche « pir » sur le réseau local avalanche-cli (Subnet-EVM, PoA).
# Usage : infra/avalanche/l1-local.sh <create|deploy|up|status|stop|start|clean|rpc>
# Prérequis : avalanche-cli (https://docs.avax.network/tooling/cli-guides/install-avalanche-cli), jq, cast (Foundry).
# Clés utilisées : clés privées de TEST publiquement connues (ewoq d'avalanche-cli, comptes Anvil) — test uniquement, jamais de fonds réels.
set -euo pipefail

CHAIN_NAME="${CHAIN_NAME:-pir}"
CHAIN_ID="${CHAIN_ID:-7810}"
TOKEN_SYMBOL="${TOKEN_SYMBOL:-PIR}"
AVALANCHE="${AVALANCHE:-$HOME/bin/avalanche}"
SUBNET_DIR="$HOME/.avalanche-cli/subnets/$CHAIN_NAME"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ewoq : clé de test publique d'avalanche-cli (déployeur + owner PoA)
EWOQ_ADDR="0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
# Comptes de démo = comptes Anvil/Hardhat 0, 1, 2 (mnémonique public « test test … junk »)
DEMO_PAYER="f39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
DEMO_BENEFICIARY="70997970C51812dc3A010C7d01b50e0d17dc79C8"
DEMO_AUDITOR="3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
DEMO_BALANCE="0xd3c21bcecceda1000000" # 1 000 000 PIR

cmd_create() {
  "$AVALANCHE" blockchain create "$CHAIN_NAME" --force --evm --test-defaults \
    --evm-chain-id "$CHAIN_ID" --evm-token "$TOKEN_SYMBOL" \
    --proof-of-authority --validator-manager-owner "$EWOQ_ADDR" --skip-update-check
  # Pré-allocation des 3 comptes de démo en plus d'ewoq (test-defaults)
  jq --arg b "$DEMO_BALANCE" \
    ".alloc[\"$DEMO_PAYER\"]={balance:\$b} | .alloc[\"$DEMO_BENEFICIARY\"]={balance:\$b} | .alloc[\"$DEMO_AUDITOR\"]={balance:\$b}" \
    "$SUBNET_DIR/genesis.json" > "$SUBNET_DIR/genesis.json.tmp"
  mv "$SUBNET_DIR/genesis.json.tmp" "$SUBNET_DIR/genesis.json"
  jq -S . "$SUBNET_DIR/genesis.json" > "$HERE/genesis-$CHAIN_NAME.json"
  echo "✓ genesis écrite : $HERE/genesis-$CHAIN_NAME.json"
}

cmd_deploy() {
  "$AVALANCHE" blockchain deploy "$CHAIN_NAME" --local --skip-update-check
  # Le téléchargement du signature-aggregator échoue parfois (réseau) et laisse l'init PoA non faite :
  # on la rejoue ; « already initialized » signifie que deploy l'a déjà faite.
  local out
  if ! out="$("$AVALANCHE" contract initValidatorManager "$CHAIN_NAME" --local --genesis-key --skip-update-check 2>&1)"; then
    echo "$out" | grep -q "already initialized" || { echo "$out"; exit 1; }
    echo "✓ Validator Manager PoA déjà initialisé"
  fi
  cmd_rpc
}

cmd_rpc() {
  local rpc
  rpc="$("$AVALANCHE" blockchain describe "$CHAIN_NAME" --skip-update-check 2>/dev/null \
    | grep -o 'http://127.0.0.1:[0-9]*/ext/bc/[A-Za-z0-9]*/rpc' | head -1)"
  echo "CHAIN_RPC_URL=$rpc"
  echo "CHAIN_ID=$(cast chain-id --rpc-url "$rpc")"
  for a in "$EWOQ_ADDR" "0x$DEMO_PAYER" "0x$DEMO_BENEFICIARY" "0x$DEMO_AUDITOR"; do
    echo "$a $(cast balance -e --rpc-url "$rpc" "$a") $TOKEN_SYMBOL"
  done
}

case "${1:-}" in
  create) cmd_create ;;
  deploy) cmd_deploy ;;
  up) cmd_create && cmd_deploy ;;
  rpc) cmd_rpc ;;
  status) "$AVALANCHE" network status --skip-update-check ;;
  stop) "$AVALANCHE" network stop --skip-update-check ;;
  start) "$AVALANCHE" network start --skip-update-check && cmd_rpc ;;
  clean) "$AVALANCHE" network clean --skip-update-check ;;
  *) sed -n '2,5p' "$0"; exit 1 ;;
esac
