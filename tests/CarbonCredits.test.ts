import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

describe("Carbon Credits Contract Tests", () => {
  it("ensures simnet is well initialized", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("mints a carbon credit and checks metadata", () => {
    // Call the test-mint function
    const mintResult = simnet.callPublicFn(
      "CarbonCredits",
      "test-mint",
      [],
      address1
    );

    // Ensure the minting was successful
    expect(mintResult.result).toBeOk();

    // Check the metadata of the minted token
    const metadataResult = simnet.callReadOnlyFn(
      "CarbonCredits",
      "get-token-metadata",
      [types.uint(1)],
      address1
    );

    expect(metadataResult.result).toBeOk();
    expect(metadataResult.result).toHaveProperty("project", "Project A");
    expect(metadataResult.result).toHaveProperty("location", "USA");
    expect(metadataResult.result).toHaveProperty("metric-ton", types.uint(10));
    expect(metadataResult.result).toHaveProperty("retired", false);
  });

  it("transfers a carbon credit to another wallet", () => {
    // Mint a carbon credit first
    simnet.callPublicFn(
      "CarbonCredits",
      "mint-carbon-credit",
      [types.utf8("Project B"), types.utf8("Germany"), types.uint(20)],
      address1
    );

    // Transfer the carbon credit to address2
    const transferResult = simnet.callPublicFn(
      "CarbonCredits",
      "transfer-carbon-credit",
      [types.uint(1), types.principal(address2)],
      address1
    );

    // Ensure the transfer was successful
    expect(transferResult.result).toBeOk();

    // Check the new owner of the token
    const ownerResult = simnet.callReadOnlyFn(
      "CarbonCredits",
      "get-token-owner",
      [types.uint(1)],
      address1
    );

    expect(ownerResult.result).toBeOk();
    expect(ownerResult.result).toBePrincipal(address2);
  });

  it("retires a carbon credit", () => {
    // Mint a carbon credit first
    simnet.callPublicFn(
      "CarbonCredits",
      "mint-carbon-credit",
      [types.utf8("Project C"), types.utf8("Brazil"), types.uint(30)],
      address1
    );

    // Retire the carbon credit
    const retireResult = simnet.callPublicFn(
      "CarbonCredits",
      "retire-carbon-credit",
      [types.uint(1)],
      address1
    );

    // Ensure the retirement was successful
    expect(retireResult.result).toBeOk();

    // Check the metadata to ensure the token is retired
    const metadataResult = simnet.callReadOnlyFn(
      "CarbonCredits",
      "get-token-metadata",
      [types.uint(1)],
      address1
    );

    expect(metadataResult.result).toBeOk();
    expect(metadataResult.result).toHaveProperty("retired", true);
  });

  it("gets metadata for a carbon credit", () => {
    // Mint a carbon credit first
    simnet.callPublicFn(
      "CarbonCredits",
      "mint-carbon-credit",
      [types.utf8("Project D"), types.utf8("India"), types.uint(40)],
      address1
    );

    // Get the metadata for the token
    const metadataResult = simnet.callReadOnlyFn(
      "CarbonCredits",
      "get-token-metadata",
      [types.uint(1)],
      address1
    );

    // Ensure the metadata is correct
    expect(metadataResult.result).toBeOk();
    expect(metadataResult.result).toHaveProperty("project", "Project D");
    expect(metadataResult.result).toHaveProperty("location", "India");
    expect(metadataResult.result).toHaveProperty("metric-ton", types.uint(40));
  });

  it("gets the owner of a carbon credit", () => {
    // Mint a carbon credit first
    simnet.callPublicFn(
      "CarbonCredits",
      "mint-carbon-credit",
      [types.utf8("Project E"), types.utf8("Canada"), types.uint(50)],
      address1
    );

    // Get the owner of the token
    const ownerResult = simnet.callReadOnlyFn(
      "CarbonCredits",
      "get-token-owner",
      [types.uint(1)],
      address1
    );

    // Ensure the owner is correct
    expect(ownerResult.result).toBeOk();
    expect(ownerResult.result).toBePrincipal(address1);
  });
});
