import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';

Clarinet.test({
  name: "List carbon credit for sale - success",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    const price = 5000000; // 5 STX (in microSTX)

    // Mint a token first
    chain.mineBlock([
      Tx.contractCall('CarbonCredits', 'mint-carbon-credit', [
        types.utf8('Wind Farm'),
        types.utf8('Texas'),
        types.uint(1000)
      ], wallet1.address)
    ]);

    // List for sale
    const listBlock = chain.mineBlock([
      Tx.contractCall('CarbonCredits', 'list-for-sale', [
        types.uint(1),
        types.uint(price)
      ], wallet1.address)
    ]);

    // Verify listing was successful
    listBlock.receipts[0].result.expectOk().expectUint(1);

    // Check listing details
    const listing = chain.callReadOnlyFn(
      'CarbonCredits',
      'get-listing',
      [types.uint(1)],
      wallet1.address
    );
    
    listing.result.expectSome().expectTuple({
      seller: types.principal(wallet1.address),
      price: types.uint(price)
    });
  }
});

Clarinet.test({
  name: "Non-owner cannot list token for sale",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    const price = 5000000;

    // Mint token to wallet1
    chain.mineBlock([
      Tx.contractCall('CarbonCredits', 'mint-carbon-credit', [
        types.utf8('Solar Project'),
        types.utf8('California'),
        types.uint(500)
      ], wallet1.address)
    ]);

    // Attempt to list by non-owner (wallet2)
    const listBlock = chain.mineBlock([
      Tx.contractCall('CarbonCredits', 'list-for-sale', [
        types.uint(1),
        types.uint(price)
      ], wallet2.address)
    ]);

    // Should fail with error u200 (not owner)
    listBlock.receipts[0].result.expectErr().expectUint(200);
  }
});

Clarinet.test({
  name: "Get listing for non-listed token returns none",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;

    // Mint a token but don't list it
    chain.mineBlock([
      Tx.contractCall('CarbonCredits', 'mint-carbon-credit', [
        types.utf8('Reforestation'),
        types.utf8('Brazil'),
        types.uint(2000)
      ], wallet1.address)
    ]);

    // Check listing for token ID 1
    const listing = chain.callReadOnlyFn(
      'CarbonCredits',
      'get-listing',
      [types.uint(1)],
      wallet1.address
    );
    
    listing.result.expectNone();
  }
});

Clarinet.test({
  name: "Cannot list already listed token again",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const price = 3000000;

    // Mint and list a token
    chain.mineBlock([
      Tx.contractCall('CarbonCredits', 'mint-carbon-credit', [
        types.utf8('Hydro Project'),
        types.utf8('Canada'),
        types.uint(800)
      ], wallet1.address),
      Tx.contractCall('CarbonCredits', 'list-for-sale', [
        types.uint(1),
        types.uint(price)
      ], wallet1.address)
    ]);

    // Attempt to list same token again
    const listBlock = chain.mineBlock([
      Tx.contractCall('CarbonCredits', 'list-for-sale', [
        types.uint(1),
        types.uint(price * 2) // Different price
      ], wallet1.address)
    ]);

    // Should fail with error u201 (listing already exists)
    listBlock.receipts[0].result.expectErr().expectUint(201);
  }
});
