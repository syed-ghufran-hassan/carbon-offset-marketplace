import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';

Clarinet.test({
  name: "Successfully buy a listed carbon credit - full verification",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const seller = accounts.get('wallet_1')!;
    const buyer = accounts.get('wallet_2')!;
    const price = 7500000; // 7.5 STX

    // Setup phase
    chain.mineBlock([
      // Mint NFT to seller
      Tx.contractCall('CarbonCredits', 'mint-carbon-credit', [
        types.utf8('Geothermal Plant'),
        types.utf8('Iceland'),
        types.uint(2500)
      ], seller.address),
      // List for sale
      Tx.contractCall('CarbonListing', 'list-for-sale', [
        types.uint(1),
        types.uint(price)
      ], seller.address)
    ]);

    // Pre-purchase verification
    const initialSellerBalance = chain.getAssetsMaps().assets['STX'][seller.address];
    const initialBuyerBalance = chain.getAssetsMaps().assets['STX'][buyer.address];
    
    // Execute purchase
    const block = chain.mineBlock([
      Tx.contractCall('CarbonListing', 'buy-carbon-credit', [
        types.uint(1)
      ], buyer.address)
    ]);

    // Verify transaction success
    block.receipts[0].result.expectOk().expectUint(1);

    // Post-purchase verification
    const finalSellerBalance = chain.getAssetsMaps().assets['STX'][seller.address];
    const finalBuyerBalance = chain.getAssetsMaps().assets['STX'][buyer.address];

    // Verify STX balances changed correctly
    finalSellerBalance.expectEquals(initialSellerBalance + price);
    finalBuyerBalance.expectEquals(initialBuyerBalance - price);

    // Verify NFT ownership transfer
    const newOwner = chain.callReadOnlyFn(
      'CarbonCredits',
      'get-token-owner',
      [types.uint(1)],
      deployer.address
    );
    newOwner.result.expectOk().expectPrincipal(buyer.address);

    // Verify listing removal
    const listing = chain.callReadOnlyFn(
      'CarbonListing',
      'get-listing',
      [types.uint(1)],
      deployer.address
    );
    listing.result.expectNone();

    // Verify NFT metadata remains unchanged
    const metadata = chain.callReadOnlyFn(
      'CarbonCredits',
      'get-token-metadata',
      [types.uint(1)],
      deployer.address
    );
    metadata.result.expectOk().expectTuple({
      project: types.utf8('Geothermal Plant'),
      location: types.utf8('Iceland'),
      'metric-ton': types.uint(2500),
      retired: types.bool(false)
    });
  }
});

Clarinet.test({
  name: "Cannot buy carbon credit with wrong token ID",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const buyer = accounts.get('wallet_1')!;

    // Attempt to buy non-existent token
    const block = chain.mineBlock([
      Tx.contractCall('CarbonListing', 'buy-carbon-credit', [
        types.uint(9999) // Invalid token ID
      ], buyer.address)
    ]);

    // Verify correct error code
    block.receipts[0].result.expectErr().expectUint(300);
  }
});

Clarinet.test({
  name: "Cannot buy carbon credit with insufficient STX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const seller = accounts.get('wallet_1')!;
    const buyer = accounts.get('wallet_2')!;
    const expensivePrice = 100000000000; // 100,000 STX

    // Setup expensive listing
    chain.mineBlock([
      Tx.contractCall('CarbonCredits', 'mint-carbon-credit', [
        types.utf8('Nuclear Plant'),
        types.utf8('France'),
        types.uint(10000)
      ], seller.address),
      Tx.contractCall('CarbonListing', 'list-for-sale', [
        types.uint(1),
        types.uint(expensivePrice)
      ], seller.address)
    ]);

    // Attempt purchase
    const block = chain.mineBlock([
      Tx.contractCall('CarbonListing', 'buy-carbon-credit', [
        types.uint(1)
      ], buyer.address)
    ]);

    // Verify failure
    block.receipts[0].result.expectErr();

    // Verify listing still exists
    const listing = chain.callReadOnlyFn(
      'CarbonListing',
      'get-listing',
      [types.uint(1)],
      seller.address
    );
    listing.result.expectSome();
  }
});

Clarinet.test({
  name: "Cannot buy already purchased carbon credit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const seller = accounts.get('wallet_1')!;
    const buyer1 = accounts.get('wallet_2')!;
    const buyer2 = accounts.get('wallet_3')!;
    const price = 3000000; // 3 STX

    // Setup and first purchase
    chain.mineBlock([
      Tx.contractCall('CarbonCredits', 'mint-carbon-credit', [
        types.utf8('Hydroelectric Dam'),
        types.utf8('Norway'),
        types.uint(5000)
      ], seller.address),
      Tx.contractCall('CarbonListing', 'list-for-sale', [
        types.uint(1),
        types.uint(price)
      ], seller.address),
      Tx.contractCall('CarbonListing', 'buy-carbon-credit', [
        types.uint(1)
      ], buyer1.address)
    ]);

    // Attempt second purchase
    const block = chain.mineBlock([
      Tx.contractCall('CarbonListing', 'buy-carbon-credit', [
        types.uint(1)
      ], buyer2.address)
    ]);

    // Verify failure with correct error code
    block.receipts[0].result.expectErr().expectUint(300);
  }
});

Clarinet.test({
  name: "Buying removes listing even if subsequent operations fail",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const seller = accounts.get('wallet_1')!;
    const buyer = accounts.get('wallet_2')!;
    const price = 2000000; // 2 STX

    // Setup with mock contract that will fail transfers
    chain.mineBlock([
      // Deploy mock CarbonCredits that fails transfers
      Tx.contractDeploy('mock-carbon-credits', 'carbon-credits-mock.clar', deployer.address),
      // Set mock as CarbonCredits in CarbonListing contract
      Tx.contractCall('CarbonListing', 'set-carbon-credits-contract', [
        types.principal(deployer.address + '.mock-carbon-credits')
      ], deployer.address),
      // Mint and list token
      Tx.contractCall('mock-carbon-credits', 'mint-mock-token', [
        types.principal(seller.address)
      ], deployer.address),
      Tx.contractCall('CarbonListing', 'list-for-sale', [
        types.uint(1),
        types.uint(price)
      ], seller.address)
    ]);

    // Attempt purchase
    const block = chain.mineBlock([
      Tx.contractCall('CarbonListing', 'buy-carbon-credit', [
        types.uint(1)
      ], buyer.address)
    ]);

    // Verify listing was removed despite transfer failure
    const listing = chain.callReadOnlyFn(
      'CarbonListing',
      'get-listing',
      [types.uint(1)],
      deployer.address
    );
    listing.result.expectNone();

    // Verify STX were still transferred
    const sellerBalance = chain.getAssetsMaps().assets['STX'][seller.address];
    sellerBalance.expectGreaterThan(0);
  }
});
