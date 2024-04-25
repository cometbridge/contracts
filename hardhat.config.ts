import { HardhatUserConfig, vars } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'

const WALLET_PRIVATE_KEY = vars.get('WALLET_PRIVATE_KEY')

const accounts = WALLET_PRIVATE_KEY !== undefined ? [WALLET_PRIVATE_KEY] : []

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  networks: {
    Arbitrum: {
      url: 'https://arbitrum-one-rpc.publicnode.com',
      accounts: accounts
    },
    Mode: {
      url: 'https://mainnet.mode.network',
      accounts: accounts
    },
    local: {
      url: 'http://127.0.0.1:8545/',
      accounts: accounts
    }
  }
}

export default config
