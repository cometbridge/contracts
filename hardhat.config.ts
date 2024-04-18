import { HardhatUserConfig } from 'hardhat/config'

import '@matterlabs/hardhat-zksync-deploy'
import '@matterlabs/hardhat-zksync-solc'

import '@matterlabs/hardhat-zksync-verify'

const zkSyncTestnet = {
  url: 'https://zksync-sepolia.drpc.org',
  ethNetwork: 'sepolia',
  zksync: true,
  // contract verification endpoint
  verifyURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification'
}

const zkLinkTestnet = {
  url: 'https://sepolia.rpc.zklink.io',
  ethNetwork: 'sepolia',
  zksync: true,
}

const config: HardhatUserConfig = {
  zksolc: {
    version: 'latest',
    settings: {}
  },
  defaultNetwork: 'zkLinkTestnet',
  networks: {
    hardhat: {
      zksync: false
    },
    zkSyncTestnet,
    zkLinkTestnet
  },
  solidity: {
    version: '0.8.24'
  }
}

export default config
