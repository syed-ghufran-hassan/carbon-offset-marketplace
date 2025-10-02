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

The mint function validates input parameters and ensures data integrity:

- Project names limited to 50 UTF-8 characters
- Location names limited to 50 UTF-8 characters
- Metric ton values must be greater than zero

## Contract Interaction Patterns 

The system uses five interconnected smart contracts with distinct interaction patterns:

1. Cross-Contract Ownership Verification Pattern
The CarbonListing contract validates token ownership by calling into CarbonCredits before allowing listings. `CarbonListing.clar:22` This pattern ensures only legitimate owners can list tokens for sale.

2. Atomic Transaction Orchestration Pattern
The CarbonMarketplace contract coordinates multi-step transactions by chaining operations across contracts. `CarbonMarketplace.clar:19-31` It handles STX payment, NFT transfer, and listing cleanup as a single atomic operation.

3. Event Broadcasting Pattern
All state-changing operations emit events through the CarbonCreditEvents contract for off-chain integration. `CarbonCreditEvents.clar:10` `CarbonCreditEvents.clar:38-43`

4. State Consistency Pattern
The CarbonRetirement contract maintains consistency by updating metadata and removing marketplace listings simultaneously. `CarbonRetirement.clar:19-28`



## Carbon Credit Lifecycle States and Transitions

The carbon credit system follows a four-phase lifecycle with distinct states and transitions managed across multiple smart contracts: `CarbonCredits.clar:32-53`

### State 1: Minted

Initial State: Carbon credits begin as newly minted NFTs with retired: false `CarbonCredits.clar:44`

### Transitions from Minted:

- To Listed: Owner calls list-for-sale(token-id, price) `CarbonListing.clar:19-39`

- To Retired: Owner calls retire-carbon-credit(token-id) `CarbonRetirement.clar:5-34`

### State 2: Listed

- Active State: Credits available for purchase on marketplace with seller and price data stored `CarbonListing.clar:10-12`

### Transitions from Listed:

- To Minted: Seller calls cancel-listing(token-id) `CarbonListing.clar:53-67`

- To Purchased: Buyer calls buy-carbon-credit(token-id) CarbonMarketplace.clar:5-38

- To Retired: Owner calls retire-carbon-credit(token-id) (automatically removes listing) `CarbonRetirement.clar:28`

### State 3: Purchased

- Transient State: Atomic transaction involving STX payment transfer and NFT ownership change `CarbonMarketplace.clar:19-26`

### Transitions from Purchased:

- To Minted: Ownership transferred to buyer, listing removed CarbonMarketplace.clar:31

### State 4: Retired

- Terminal State: Credits permanently marked as consumed with retired: true, preventing double-counting `CarbonRetirement.clar:19-23`

No transitions from Retired: This is a permanent, irreversible state

## System Architecture

It explains the high-level architecture of the Carbon Offset Marketplace, focusing on how the five core smart contracts work together to enable trading of carbon credits as NFTs on the Stacks blockchain. The architecture demonstrates clear separation of concerns across contract boundaries while maintaining data consistency and enabling comprehensive event tracking.

The carbon offset marketplace consists of 5 interconnected smart contracts organized in a hierarchical architecture:

### Primary Contracts (Core Functionality)

CarbonListing.clar `CarbonListing.clar:1-12`

- Functions: list-for-sale, get-listing, cancel-listing, update-listing
- Manages marketplace inventory with listings map storing seller/price pairs

CarbonCredits.clar  `CarbonCredits.clar:4-23`

- Functions: mint, transfer, get-owner, get-token-metadata
- Core NFT contract with token-owners and token-metadata maps

CarbonCreditEvents.clar `CarbonCreditEvents.clar:6-14`

- Functions: mint, retire, list-token, purchase
- Event emission system for off-chain integration

### Secondary Contracts (Orchestration)

CarbonRetirement.clar `CarbonRetirement.clar:5-6`

- Functions: retire-carbon-credit
- Handles permanent credit consumption

CarbonMarketplace.clar `CarbonMarketplace.clar:5-6`

- Functions: buy-carbon-credit
- Orchestrates purchase transactions with STX payments

### Contract Dependencies

`CarbonListing → CarbonCredits (ownership verification)`  

`CarbonMarketplace → CarbonListing (listing lookup)`  

`CarbonMarketplace → CarbonCredits (ownership transfer)`

`CarbonRetirement → CarbonCredits (metadata updates)`

`CarbonRetirement → CarbonListing (listing removal)`

`All contracts → CarbonCreditEvents (event emission)`

`CarbonMarketplace → STX Token System (payments)`

`CarbonCredits → Stacks Blockchain (NFT standards) `

### External Integrations

- STX Token System: Payment processing for marketplace transactions `CarbonMarketplace.clar:19`
- Stacks Blockchain: NFT standards (SIP-009) compliance `CarbonCredits.clar:4`

## Contract Responsibilities

| Contract            | Primary Purpose                  | Key Data Structures                                |
|---------------------|----------------------------------|---------------------------------------------------|
| **CarbonCredits**   | NFT management and ownership     | token-owners map, token-metadata map, carbon-credit NFT |
| **CarbonListing**   | Marketplace inventory management | listings map with seller/price pairs              |
| **CarbonCreditEvents** | Event emission and observability | Event printing for off-chain integration          |
| **CarbonMarketplace** | Purchase transaction logic      | STX payment processing                            |
| **CarbonRetirement** | Credit lifecycle termination    | Retirement status updates                         |

### Flow

Minting: `User → CarbonCredits.mint() → Store in token-owners & token-metadata maps → Increment next-token-id → Return token-id  `

Listing: `Token Owner → CarbonListing.list-for-sale() → CarbonCredits.get-owner() → Validate ownership → Store in listings map → Return token-id `

Purchase: `Buyer → CarbonMarketplace.buy-carbon-credit() → CarbonListing.get-listing() → stx-transfer? (payment) → CarbonCredits.transfer-carbon-credit() → Remove from listings → Return token-id `

Retirement: `Token Owner → CarbonRetirement.retire-carbon-credit() → Validate ownership → Update metadata (retired: true) → Remove from listings → Return token-id `

Event Emission: `Any State Change → CarbonCreditEvents.{mint|list-token|purchase|retire}() → print() event → Return success `

### Key Interaction Patterns

- Ownership Verification: CarbonListing calls CarbonCredits.get-owner to validate listing permissions 
`contracts/CarbonListing.clar22`

- Cross-Contract State Updates: `CarbonMarketplace` coordinates ownership transfer and payment processing

- Event Broadcasting: All state-changing operations emit events through `CarbonCreditEvents`

- Data Consistency: Listings are automatically removed when credits are transferred or retired








