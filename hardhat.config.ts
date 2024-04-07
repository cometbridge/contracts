import { HardhatUserConfig, vars } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'

const WALLET_PRIVATE_KEY = vars.get('WALLET_PRIVATE_KEY')

const accounts = WALLET_PRIVATE_KEY !== undefined ? [WALLET_PRIVATE_KEY] : []

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  networks: {
    Sepolia: {
      url: 'https://rpc.sepolia.org',
      accounts: accounts
    },
    ArbSepolia: {
      url: 'https://sepolia-rollup.arbitrum.io/rpc',
      accounts: accounts
    },
    BlastSepolia: {
      url: 'https://sepolia.blast.io',
      accounts: accounts
    },
    ScrollSepolia: {
      url: 'https://sepolia-rpc.scroll.io',
      accounts: accounts
    },
    KromaSepolia: {
      url: 'https://api.sepolia.kroma.network',
      accounts: accounts
    },
    HoleSky: {
      url: 'https://ethereum-holesky.publicnode.com',
      accounts: accounts
    },
    Katla: {
      url: 'https://rpc.katla.taiko.xyz',
      accounts: accounts
    },
    local: {
      url: 'http://127.0.0.1:8545/',
      accounts: accounts
    }
  }
}

export default config
