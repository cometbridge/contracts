import axios from 'axios'
import { formatUnits, parseUnits, Interface } from 'ethers'
import { CometChain, CometRoutes, DestinationGasCostMap } from '../types'
import {
  createCurrencyKey,
  createRouteKey,
  currencyFind,
  getBridgeFee,
  getBridgeParams,
  getCurrencyAvailableChains,
  getDestinationGasCost,
  getSupportedCurrencies
} from '../utils'

const ERR_OK = 0

interface IResponse<T> {
  data: T
  code: number
  message: string
}

async function getChainConfigList() {
  const res = await axios.get<IResponse<CometChain[]>>('https://api.cometbridge.app/getChainConfigList')

  if (res.data.code === ERR_OK) {
    return res.data.data.map(item => ({
      ...item,
      tokens: [...item.tokens, { ...item.nativeCurrency, isNative: true }]
    })) as CometChain[]
  }

  throw Error('unknown get config error')
}

async function getRoutes() {
  const res = await axios.get<IResponse<CometRoutes>>('https://api.cometbridge.app/getRoutes')

  if (res.data.code === ERR_OK) {
    return res.data.data
  }

  throw Error('unknown get routes error')
}

async function getDestinationGasCostMap() {
  const res = await axios.get<IResponse<DestinationGasCostMap>>('https://api.cometbridge.app/getAllChainEstimation')

  if (res.data.code === ERR_OK) {
    return res.data.data
  }

  throw Error('unknown get destination gas cost error')
}

async function main() {
  const chains = await getChainConfigList()
  const routes = await getRoutes()
  const destinationGasCostMap = await getDestinationGasCostMap()

  const supportedCurrencies = getSupportedCurrencies(routes, chains)

  const [currency] = supportedCurrencies
  const [original] = chains
  const [, originalAvailableTargets] = getCurrencyAvailableChains(routes, chains, currency, original)
  const target1 = originalAvailableTargets[0]

  const route = routes[createRouteKey(original, target1)][createCurrencyKey(currency.symbol)]

  console.log('Bridge Currency:', currency.symbol)
  console.log('Bridge Original:', original.name)
  console.log('Bridge Target:', target1.name)

  const originalToken = currencyFind(original.tokens, currency)
  const targetlToken = currencyFind(original.tokens, currency)

  if (!originalToken || !targetlToken) {
    throw Error(`Can't find bridge token`)
  }

  const bridgeAmount = '0.01' // bridgeAmount > route.minAmount; bridgeAmount < route.maxAmount

  const originalAmount = parseUnits(bridgeAmount, originalToken.decimals)
  const targetAmount = parseUnits(bridgeAmount, targetlToken.decimals)

  const bridgeFeeOriginal = getBridgeFee(route.bridgeFeeRate, originalAmount)
  const bridgeFeeTarget = getBridgeFee(route.bridgeFeeRate, targetAmount)

  const originalDestinationGasCost = getDestinationGasCost(destinationGasCostMap, target1, originalToken, route)
  const targetDestinationGasCost = getDestinationGasCost(destinationGasCostMap, target1, targetlToken, route)

  if (!originalDestinationGasCost || !targetDestinationGasCost) {
    throw Error(`Can't find destination gas cost`)
  }

  const targetFee = bridgeFeeTarget + targetDestinationGasCost //fee total
  const destAmount = targetAmount - targetFee

  const originalFee = bridgeFeeOriginal + originalDestinationGasCost

  console.log('Bridge Amount', bridgeAmount, originalToken.symbol)
  console.log('Bridge Fee', formatUnits(originalFee, originalToken.decimals), originalToken.symbol)

  console.log('Dest Amount', formatUnits(destAmount, targetlToken.decimals), targetlToken.symbol)

  const params = getBridgeParams({
    original,
    target: target1,
    route,
    currency,
    // test account
    account: '0x5A36111cCf5B5692725822518C4AC8B76E184AD4',
    amount: originalAmount,
    destinationAddress: undefined
  })

  console.log('Tx Params', params)
}

main()
