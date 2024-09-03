import { HardhatUserConfig, vars } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'

const WALLET_PRIVATE_KEY = vars.get('WALLET_PRIVATE_KEY')
const BASESCAN_API_KEY = vars.get('BASESCAN_API_KEY')
const ARBSCAN_API_KEY = vars.get('ARBSCAN_API_KEY')
const OPSCAN_API_KEY = vars.get('OPSCAN_API_KEY')
const ETHERSCAN_API_KEY = vars.get('ETHERSCAN_API_KEY')
const BSCSCAN_API_KEY = vars.get('BSCSCAN_API_KEY')

const accounts = WALLET_PRIVATE_KEY !== undefined ? [WALLET_PRIVATE_KEY] : []

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  networks: {
    Ethereum: {
      url: 'https://ethereum.rpc.subquery.network/public',
      accounts: accounts
    },
    Arbitrum: {
      url: 'https://arbitrum-one-rpc.publicnode.com',
      accounts: accounts
    },
    Mint: {
      url: 'https://rpc.mintchain.io',
      accounts: accounts
    },
    Taiko: {
      url: 'https://rpc.mainnet.taiko.xyz',
      accounts: accounts
    },
    Mode: {
      url: 'https://mainnet.mode.network',
      accounts: accounts
    },
    Scroll: {
      url: 'https://rpc.scroll.io',
      accounts: accounts
    },
    Linea: {
      url: 'https://rpc.linea.build',
      accounts: accounts
    },
    Base: {
      url: 'https://1rpc.io/base',
      accounts: accounts
    },
    Zeta: {
      url: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
      accounts: accounts
    },
    Merlin: {
      url: 'https://merlin.blockpi.network/v1/rpc/public',
      accounts: accounts
    },
    Bitlayer: {
      url: 'https://rpc.ankr.com/bitlayer',
      accounts: accounts
    },
    XLayer: {
      url: 'https://rpc.xlayer.tech',
      accounts: accounts
    },
    BSC: {
      url: 'https://bsc.rpc.blxrbdn.com',
      accounts: accounts
    },
    gravity: {
      url: 'https://rpc.gravity.xyz',
      accounts: accounts
    },
    local: {
      url: 'http://127.0.0.1:8545/',
      accounts: accounts
    }
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      base: BASESCAN_API_KEY,
      arbitrumOne: ARBSCAN_API_KEY,
      bsc: BSCSCAN_API_KEY
    }
  }
}

export default config
