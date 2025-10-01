## Purpose and Scope

This document provides an overview of the Carbon Offset Marketplace, a blockchain-based system built on the Stacks blockchain that enables the trading of carbon credits as non-fungible tokens (NFTs). The system allows companies and individuals to purchase, sell, and retire carbon credits representing metric tons of CO₂ reduced or removed from the atmosphere.

This overview covers the high-level system architecture, core contracts, and carbon credit lifecycle.

## System Architecture

The Carbon Offset Marketplace consists of five interconnected Clarity smart contracts that manage the complete lifecycle of carbon credits from minting through retirement.

## Core Contract Architecture

<img width="866" height="703" alt="image" src="https://github.com/user-attachments/assets/302b5083-2e7c-4476-924d-62334d6cb2f8" />

## Carbon Credit Lifecycle 

Carbon credits in the marketplace follow a defined lifecycle from creation to retirement, managed through the smart contract system.

## Core Features

### NFT-Based Carbon Credits

The system implements carbon credits as NFTs using the `carbon-credit` token type defined in `CarbonCredits.clar`. Each token represents a specific carbon offset project with immutable metadata.

| Field | Type | Description |
|-------|------|-------------|
| `project` | `string-utf8 50` | Carbon offset project name |
| `location` | `string-utf8 50` | Geographic location of project |
| `metric-ton` | `uint` | Amount of CO₂ offset in metric tons |
| `retired` | `bool` | Retirement status (prevents double-counting) |

### Marketplace Operations

The marketplace enables transparent trading of carbon credits with the following capabilities:

- Listing Management: Owners can list credits for sale with specified prices
- Purchase Processing: Buyers can purchase listed credits with automatic payment and ownership transfer
- Ownership Verification: All operations verify ownership through the token-owners map
- Event Tracking: All marketplace activities emit events for off-chain monitoring

### Carbon Credit Retirement

The retirement system ensures carbon credits can only be used once for offset purposes. When retired:

- The retired field in token-metadata is set to true
- Credits are removed from all marketplace listings
- Further trading is prevented
- Retirement events are emitted for compliance tracking

### Technical Foundation

The system is built on the Stacks blockchain using Clarity smart contracts, providing:

- Immutable Ownership Records: Token ownership stored in the token-owners map
- Metadata Integrity: Project details stored immutably in token-metadata map
- Automatic ID Management: Sequential token IDs managed by next-token-id data variable
- SIP-009 Compliance: Follows Stacks NFT standards for interoperability
- The mint function validates input parameters and ensures data integrity:

- Project names limited to 50 UTF-8 characters
- Location names limited to 50 UTF-8 characters
- Metric ton values must be greater than zero





