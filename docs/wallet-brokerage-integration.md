# Web3 Wallet & Brokerage Integration Guide

## Overview
This integration allows users to connect both Web3 wallets and traditional brokerage accounts to create a unified portfolio view and enable trading across both ecosystems.

## Features

### Web3 Wallet Integration
- **Multi-chain Support**: Ethereum, Polygon, Arbitrum, Optimism, Base
- **Wallet Providers**: MetaMask, WalletConnect, Coinbase Wallet, Rainbow
- **Real-time Balance**: Live ETH and token balances
- **Transaction History**: On-chain transaction tracking
- **DeFi Integration**: Connect to DeFi protocols

### Brokerage Integration
- **Plaid Integration**: Connect 12,000+ financial institutions
- **Alpaca Markets**: Commission-free trading API
- **Portfolio Sync**: Real-time position and balance updates
- **Multiple Account Types**: Cash, margin, retirement accounts
- **Transaction History**: Trade history and performance tracking

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

Required configurations:
- **WalletConnect Project ID**: Get from https://cloud.walletconnect.com
- **Plaid Credentials**: Sign up at https://plaid.com
- **Alpaca API Keys**: Register at https://alpaca.markets

### 3. Database Setup
Run Prisma migrations to create the necessary tables:

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### 4. Start Development Server
```bash
pnpm dev
```

## Usage

### Connecting a Web3 Wallet
1. Click "Connect Wallet" in the Portfolio app
2. Select your wallet provider
3. Approve the connection in your wallet
4. Your Web3 assets will appear in the unified portfolio

### Connecting a Brokerage Account
1. Click "Connect Brokerage" in the Portfolio app
2. Choose your connection method:
   - **Plaid**: Select your institution and authenticate
   - **Alpaca**: OAuth flow to Alpaca Markets
   - **Manual**: Enter positions manually
3. Your traditional assets will sync automatically

### Unified Portfolio View
The portfolio displays:
- Combined total value across all accounts
- Asset allocation breakdown
- Individual position performance
- Transaction history from all sources
- Real-time price updates

## API Endpoints

### Portfolio Summary
```
GET /api/portfolio/summary
```
Returns unified portfolio data including all connected accounts

### Brokerage Connections
```
POST /api/brokerages/plaid/link-token
POST /api/brokerages/plaid/exchange
GET /api/brokerages/alpaca/auth
GET /api/brokerages/alpaca/callback
```

### Web3 Data
Web3 data is fetched client-side using wagmi hooks

## Security Considerations

1. **Token Storage**: Access tokens are encrypted before database storage
2. **API Keys**: Never expose API keys client-side
3. **HTTPS Only**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Data Privacy**: Follow financial data regulations (PCI DSS, etc.)

## Trading Features (Quant App)

The Quant app can leverage connected accounts for:
- **Automated Trading**: Execute trades via Alpaca API
- **Strategy Backtesting**: Use historical data from all accounts
- **Risk Analysis**: Analyze portfolio risk across asset classes
- **Rebalancing**: Automated portfolio rebalancing
- **DeFi Strategies**: Execute DeFi strategies via Web3

## Troubleshooting

### Wallet Connection Issues
- Ensure wallet extension is installed
- Check network compatibility
- Verify WalletConnect project ID

### Brokerage Connection Issues
- Verify API credentials
- Check account permissions
- Ensure institution is supported

### Data Sync Issues
- Check database connection
- Verify API rate limits
- Review error logs

## Future Enhancements

- Additional brokerage integrations (TD Ameritrade, E*TRADE, etc.)
- More blockchain networks
- Advanced DeFi protocol integrations
- Real-time streaming quotes
- Options and futures trading
- Tax reporting features
- Mobile app support