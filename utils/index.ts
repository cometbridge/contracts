import { Interface, parseUnits, ZeroAddress } from 'ethers'
import { Buffer } from 'buffer'
import { OriginalMetadata } from '../types/metadata'
import { CometChain, CometRoute, CometRoutes, Currency, DestinationGasCostMap, SingleCurrency } from '../types'

export function createMetadata(data: OriginalMetadata) {
  return Buffer.from(`data:,${JSON.stringify(data)}`)
}

export function currencyFind(currencies: Currency[], currency: SingleCurrency | string | undefined) {
  return currencies.find(item => {
    if (typeof currency === 'string') {
      return item.symbol.toLowerCase() === currency.toLowerCase()
    }

    return item.symbol.toLowerCase() === currency?.symbol.toLowerCase()
  })
}

export function createRouteKey(original: CometChain, target: CometChain) {
  return `${original.chainId}-${target.chainId}`
}

export function createCurrencyKey(symbol: string) {
  return `${symbol}-${symbol}`
}

export function parseRouteKey(key: string): [string, string] {
  const [originalChainId, targetChainId] = key.split('-')

  return [originalChainId, targetChainId]
}

export function parseCurrencyKey(key: string): [string, string] {
  const [symbol1, symbol2] = key.split('-')

  return [symbol1, symbol2]
}

export function getSupportedCurrencies(supportedRoutes: CometRoutes, supportedChains: CometChain[]) {
  const currencyMap: { [symbol: string]: SingleCurrency } = {}

  Object.values(supportedRoutes).map(route =>
    Object.keys(route).map(currencyKey => {
      const [symbol] = parseCurrencyKey(currencyKey)

      if (currencyMap[symbol]) {
        return
      }

      supportedChains.forEach(chain => {
        const currency = chain.tokens.find(item => item.symbol === symbol)

        if (currency && !currencyMap[currency.symbol]) {
          currencyMap[symbol] = {
            name: currency.symbol,
            symbol: currency.symbol
          }
        }
      })
    })
  )

  return Object.values(currencyMap)
}

export function getCurrencyAvailableChains(
  supportedRoutes: CometRoutes,
  supportedChains: CometChain[],
  currency: SingleCurrency,
  original?: CometChain | undefined
): [CometChain[], CometChain[]] {
  const originalChainMap: { [chainId: string]: CometChain } = {}
  const targetChainMap: { [chainId: string]: CometChain } = {}

  Object.keys(supportedRoutes).map(routeKey => {
    const route = supportedRoutes[routeKey]
    const [chainId0, chainId1] = parseRouteKey(routeKey)

    Object.keys(route).map(currencyKey => {
      const [symbol] = parseCurrencyKey(currencyKey)

      if (symbol !== currency.symbol) {
        return
      }

      if (!originalChainMap[chainId0]) {
        const chain = supportedChains.find(item => item.chainId === chainId0)

        if (chain) {
          originalChainMap[chainId0] = chain
        }
      }
      if (original) {
        if (chainId0 === original.chainId && !targetChainMap[chainId1]) {
          const chain = supportedChains.find(item => item.chainId === chainId1)

          if (chain) {
            targetChainMap[chainId1] = chain
          }
        }
      } else {
        if (!targetChainMap[chainId1]) {
          const chain = supportedChains.find(item => item.chainId === chainId1)

          if (chain) {
            targetChainMap[chainId1] = chain
          }
        }
      }
    })
  })

  return [Object.values(originalChainMap), Object.values(targetChainMap)]
}

export function getBridgeFee(rate: number, amount: bigint) {
  const FEES_DENOMINATOR = 10000

  const _rate = BigInt(parseInt((rate * FEES_DENOMINATOR).toString()))

  return (amount * _rate) / BigInt(FEES_DENOMINATOR)
}

export function getDestinationGasCost(destinationGasCostMap: DestinationGasCostMap, target: CometChain, currency: Currency, route: CometRoute) {
  const destinationGasCost = destinationGasCostMap[target.chainId]
  const baseGas = route.destinationGasCost

  const gas = destinationGasCost?.[currency.symbol]

  if (gas === undefined || baseGas === undefined) {
    return undefined
  }

  return parseUnits(gas, currency.decimals) + parseUnits(baseGas.toString(), currency.decimals)
}

export function getContractAddress(chain: CometChain | undefined, name = 'CometRouterProxy'): `0x${string}` | undefined {
  if (!chain) return undefined

  for (const address in chain.contract) {
    if (chain.contract[address] === name) {
      return address as `0x${string}`
    }
  }

  return undefined
}

export function getBridgeParams({
  target,
  original,
  account,
  currency,
  amount,
  route,
  destinationAddress
}: {
  route: CometRoute
  original: CometChain
  target: CometChain
  currency: SingleCurrency
  amount: bigint
  account: string
  destinationAddress: string | undefined
}) {
  const iface = new Interface([
    'function bridge(uint256 amount, address token, address provider, bytes metadata)'
  ])

  const metadata: OriginalMetadata = {
    targetChain: target.chainId,
    targetAddress: destinationAddress || account
  }

  const contract = getContractAddress(original)
  const metadataHex: `0x${string}` = `0x${createMetadata(metadata).toString('hex')}`

  if (contract) {
    const originalChainCurrency = currencyFind(original.tokens, currency)

    if (!originalChainCurrency) {
      throw Error(`can't find the token`)
    }

    const data = iface.encodeFunctionData('bridge', [
      amount,
      originalChainCurrency.isNative ? ZeroAddress : originalChainCurrency.address,
      route.originalProvider,
      metadataHex
    ])

    return {
      value: originalChainCurrency.isNative ? amount : 0n,
      to: contract,
      data
    }
  }

  return {
    data: metadataHex,
    value: amount,
    to: route.originalProvider
  }
}
