# L1 Avalanche « pir » — réseau local, relance, bascule Fuji

Registre de confirmation PIR (PRD §4.10 F-AVAX-1…9, projet §4 composant 8). Cible démo : une
**L1 Avalanche dédiée** (Subnet-EVM, Proof of Authority) déployée avec `avalanche-cli` sur le
**réseau local** ; repli **Fuji C-Chain** avec les mêmes contrats (chain-agnostiques : seul le
couple RPC/chainId change). Rien n'est déployé en mainnet ni avec de vrais fonds.

> Toutes les clés de ce document sont des **clés de test publiques** (ewoq d'avalanche-cli,
> mnémonique Anvil/Hardhat). Elles sont connues de tous : **ne jamais** les financer en vrai, ne
> jamais y mettre une clé réelle. Pour Fuji, la clé d'un wallet de test est fournie par le
> mécanisme de secrets de Devin, jamais dans le dépôt ni le chat.

## 1. Paramètres de la chaîne

| Paramètre         | Valeur                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------- |
| Nom               | `pir`                                                                                  |
| VM                | Subnet-EVM v0.8.0 (avalanche-cli 1.9.6)                                                |
| Validation        | Proof of Authority (owner = ewoq)                                                      |
| `chainId`         | **7810**                                                                               |
| Token de gas      | **PIR** (natif, 18 décimales) — défaut tant que le mentor n'a pas tranché « USDC-gas » |
| Genesis versionné | [`infra/avalanche/genesis-pir.json`](../infra/avalanche/genesis-pir.json)              |
| Validator Manager | `0x0FEEDC0DE0000000000000000000000000000000` (pré-déployé par avalanche-cli)           |
| SubnetID (local)  | `2W9boARgCWL25z6pMFNtkCfNA5v28VGg9PmBgUJfuKndEdhrvw`                                   |

Le `BlockchainID` (et donc l'URL RPC) **change à chaque redéploiement** du réseau local : ne le
codez jamais en dur, lisez-le avec `infra/avalanche/l1-local.sh rpc` (section 4).

## 2. Comptes de test (pré-financés 1 000 000 PIR à la genesis)

| Rôle                                      | Adresse                                      | Origine (test uniquement)                        |
| ----------------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| Déployeur / owner PoA                     | `0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC` | clé **ewoq** d'avalanche-cli (`--test-defaults`) |
| Payeur (PME FR)                           | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | compte Anvil n°0 (`test test … junk`)            |
| Bénéficiaire (fournisseur CN)             | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | compte Anvil n°1                                 |
| Auditeur (persona app, `AUDITOR_ADDRESS`) | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | compte Anvil n°2                                 |

Clé privée ewoq (publique, **test uniquement**, utilisée par défaut dans `DEPLOYER_PRIVATE_KEY`) :
`0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027`.
Les clés Anvil n°0-2 se retrouvent avec `cast wallet derive-private-key "test test test test test test test test test test test junk" <index>`.

avalanche-cli crée aussi un compte ICM (`cli-teleporter-deployer`, 600 PIR) pour les contrats
Teleporter : non utilisé par PIR pour l'instant.

## 3. Prérequis

```bash
# Foundry (cast, forge) — déjà requis par le hook pre-commit
curl -L https://foundry.paradigm.xyz | bash && foundryup
# avalanche-cli (installe ~/bin/avalanche)
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh -s
export PATH="$HOME/bin:$HOME/.foundry/bin:$PATH"
sudo apt-get install -y jq    # ou brew install jq
```

Docker n'est pas nécessaire : le réseau local tourne en processus avalanchego (5 nœuds primaires

- 1 nœud validateur L1).

## 4. Commandes

Le script [`infra/avalanche/l1-local.sh`](../infra/avalanche/l1-local.sh) encapsule les commandes
exactes ci-dessous (toutes avec `--skip-update-check`).

```bash
infra/avalanche/l1-local.sh up        # create + deploy (≈ 3 min la première fois)
infra/avalanche/l1-local.sh rpc       # affiche CHAIN_RPC_URL, CHAIN_ID et les soldes de test
infra/avalanche/l1-local.sh status    # avalanche network status
infra/avalanche/l1-local.sh stop      # arrête le réseau (état conservé)
infra/avalanche/l1-local.sh start     # relance le réseau arrêté (même BlockchainID / RPC)
infra/avalanche/l1-local.sh clean     # supprime le réseau local (la config `pir` reste)
```

Ce que fait `up` :

```bash
# 1. Création de la config (~/.avalanche-cli/subnets/pir/) : Subnet-EVM, PoA, ewoq pré-financé
avalanche blockchain create pir --force --evm --test-defaults \
  --evm-chain-id 7810 --evm-token PIR \
  --proof-of-authority --validator-manager-owner 0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC
# 2. Ajout des 3 comptes de démo dans alloc (jq), copie triée dans infra/avalanche/genesis-pir.json
# 3. Déploiement sur le réseau local + conversion en L1 + init du Validator Manager PoA
avalanche blockchain deploy pir --local
avalanche contract initValidatorManager pir --local --genesis-key   # rejouable ; « already initialized » = OK
```

Vérification manuelle :

```bash
RPC=$(infra/avalanche/l1-local.sh rpc | sed -n 's/^CHAIN_RPC_URL=//p')
cast chain-id --rpc-url "$RPC"                                       # 7810
cast balance -e --rpc-url "$RPC" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266   # 1000000 PIR
cast send --rpc-url "$RPC" --private-key 0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027 \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --value 1ether          # transfert ewoq → payeur
avalanche blockchain describe pir                                    # IDs, RPC, comptes, précompiles
```

Pas d'explorer sur le réseau local (`EXPLORER_URL` vide) : utiliser `cast tx`/`cast receipt`.

## 5. Relancer / réinitialiser

- **Après reboot ou `stop`** : `infra/avalanche/l1-local.sh start` — le réseau redémarre avec le
  même BlockchainID, les contrats déployés et les soldes sont conservés.
- **Repartir de zéro** : `infra/avalanche/l1-local.sh clean && infra/avalanche/l1-local.sh up` —
  nouveau BlockchainID (mettre à jour `CHAIN_RPC_URL`), contrats à redéployer.
- **Modifier la genesis** (chainId, token, allocations) : éditer les variables en tête du script
  puis `clean` + `up`. `avalanche blockchain create pir --force --genesis infra/avalanche/genesis-pir.json`
  est aussi possible mais pose des questions interactives (ICM, validation) : préférer le script.
- Le téléchargement du `signature-aggregator` (GitHub) échoue parfois pendant `deploy` : la
  conversion L1 passe quand même, et `initValidatorManager` (rejoué par le script) termine l'init PoA.

## 6. Variables d'environnement (`apps/web/.env.example`)

| Variable                                                    | L1 locale                      | Fuji C-Chain (repli)                           |
| ----------------------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| `CHAIN_RPC_URL`                                             | sortie de `l1-local.sh rpc`    | `https://api.avax-test.network/ext/bc/C/rpc`   |
| `CHAIN_ID`                                                  | `7810`                         | `43113`                                        |
| `EXPLORER_URL`                                              | vide                           | `https://testnet.snowtrace.io`                 |
| `DEPLOYER_PRIVATE_KEY`                                      | ewoq (test uniquement)         | clé du wallet de test fourni via secrets Devin |
| `AUDITOR_ADDRESS`                                           | Anvil n°2                      | idem ou adresse du mentor                      |
| `NEXT_PUBLIC_INTENT_REGISTRY_ADDRESS`                       | après `forge script` (étape 2) | idem                                           |
| `NEXT_PUBLIC_MOCK_USDC_ADDRESS`, `NEXT_PUBLIC_EERC_ADDRESS` | après étape 3                  | idem                                           |

## 7. Basculer vers Fuji

Deux options, mêmes contrats, même `forge script` (paramétré par `--rpc-url`) :

**A. L1 `pir` sur Fuji** (la vraie cible démo si le temps le permet)

```bash
avalanche key create pir-fuji                 # clé de test dédiée (ou --file pour importer celle fournie via secrets)
avalanche key list --fuji                     # adresse P-Chain à financer via https://core.app/tools/testnet-faucet
avalanche blockchain deploy pir --fuji --key pir-fuji --use-local-machine   # ce poste devient le validateur L1
avalanche blockchain describe pir            # RPC Fuji → CHAIN_RPC_URL, CHAIN_ID reste 7810
```

Besoins : ~2 AVAX Fuji sur la P-Chain (frais de création subnet/chaîne + solde validateur), un
poste qui reste allumé pendant la démo (ou `avalanche node create` sur un cloud), et une clé
financée **demandée via secrets Devin**. Pas d'explorer public pour une L1 custom : `EXPLORER_URL`
vide, ou un Blockscout auto-hébergé.

**B. Fuji C-Chain** (repli, zéro infra)

`CHAIN_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc`, `CHAIN_ID=43113`,
`EXPLORER_URL=https://testnet.snowtrace.io`, `DEPLOYER_PRIVATE_KEY` = wallet de test financé en
AVAX Fuji (faucet Core). Redéployer les contrats avec le même script et recopier les adresses.
Le gas est alors en AVAX, pas en PIR : aucune autre différence côté contrats ou `apps/web`.

## 8. Documentation consultée (MCP Avalanche, lecture seule)

`docs_search` / `docs_fetch` sur `https://build.avax.network/api/mcp` :
`tooling/avalanche-cli/create-avalanche-l1`, `tooling/avalanche-cli/deploy-locally`,
`tooling/avalanche-cli/deploy-on-fuji-testnet`, `avalanche-l1s/upgrade/customize-avalanche-l1`
(genesis `alloc`). Le MCP ne déploie rien : toutes les actions passent par `avalanche-cli` local.
