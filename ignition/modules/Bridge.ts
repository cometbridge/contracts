import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { ethers } from 'hardhat'

const iface = new ethers.Interface(['function initialize(bool _isEnabled)'])

const BridgeModule = buildModule('BridgeModule', m => {
  const bridge = m.contract('Bridge', [], {
    value: 0n
  })

  m.send('initialize', bridge, 0n, iface.encodeFunctionData('initialize', [0x1]))

  return { bridge }
})

export default BridgeModule
