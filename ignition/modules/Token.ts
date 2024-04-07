import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const TokenModule = buildModule('TokenModule', m => {
  const token = m.contract('GLDToken', [BigInt(10 ** 18) * BigInt(1000000)], {
    value: 0n
  })

  return { token }
})

export default TokenModule
