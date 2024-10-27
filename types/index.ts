export interface Currency {
  name: string
  symbol: string
  decimals: number
  address: string
  isNative?: boolean
}

export type SingleCurrency = Omit<Currency, 'decimals' | 'address' | 'isNative'>

export interface CometChain {
  chainId: string
  name: string
  gasRedouble: number
  contract: {
    [address: string]: string | undefined
  }
  tokens: Currency[]
  nativeCurrency: Currency
  infoURL: string
}

export interface CometRoutes {
  // "1-280"
  [routeKey: string]: {
    // "ETH-ETH"
    [currencyKey: string]: CometRoute
  }
}

export interface CometRoute {
  originalProvider: string
  targetProvider: string
  bridgeFeeRate: number
  destinationGasCost: number
  maxAmount: number
  minAmount: number
  originalDestinationGasCost: number
  originalBridgeFeeRate: number
}

export interface DestinationGasCostMap {
  [chainId: string]: DestinationGasCost
}

export interface DestinationGasCost {
  amount: string
  USDAmount: string
  [symbol: string]: string
}
