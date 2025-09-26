import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer") as string;
const user1 = accounts.get("wallet_1") as string;
const user2 = accounts.get("wallet_2") as string;

describe("Carbon Marketplace Contract", () => {
  // Helper functions
  const mintCarbonCredit = (owner: string) => {
    return simnet.callPublicFn(
      "CarbonCredits",
      "mint",
      [Cl.principal(owner), Cl.stringUtf8("Test Project"), Cl.stringUtf8("Test Location"), Cl.uint(100)],
      deployer
    );
  };

  const listTokenForSale = (tokenId: number, price: number, seller: string) => {
    return simnet.callPublicFn(
      "CarbonListing",
      "list-for-sale",
      [Cl.uint(tokenId), Cl.uint(price)],
      seller
    );
  };

  describe("buy-carbon-credit function", () => {
    it("successfully validates purchase and updates stats", () => {
      // Setup: Mint and list token
      const mintResult = mintCarbonCredit(user1);
      expect(mintResult.result).toBeOk(Cl.uint(1));

      const listResult = listTokenForSale(1, 1000, user1);
      expect(listResult.result).toBeOk(Cl.uint(1));
      
      // Execute purchase validation
      const purchaseResult = simnet.callPublicFn(
        "CarbonMarketplace",
        "buy-carbon-credit",
        [Cl.uint(1)],
        user2
      );

      expect(purchaseResult.result).toBeOk(Cl.uint(1));

      // Verify stats were updated
      const statsResult = simnet.callReadOnlyFn(
        "CarbonMarketplace",
        "get-marketplace-stats",
        [],
        user2
      );

      expect(statsResult.result).toBeOk(
        Cl.tuple({
          "total-sales": Cl.uint(1),
          "total-volume": Cl.uint(1000)
        })
      );
    });

    it("fails when purchasing non-listed token", () => {
      mintCarbonCredit(user1);

      const result = simnet.callPublicFn(
        "CarbonMarketplace",
        "buy-carbon-credit",
        [Cl.uint(1)],
        user2
      );

      expect(result.result).toBeErr(Cl.uint(300)); // Listing not found
    });

    it("fails when token doesn't exist", () => {
      const result = simnet.callPublicFn(
        "CarbonMarketplace",
        "buy-carbon-credit",
        [Cl.uint(999)], // Non-existent token
        user2
      );

      // Fixed: Should be u300 (listing not found) since that's checked first
      expect(result.result).toBeErr(Cl.uint(300));
    });

    it("fails when seller no longer owns the token", () => {
      // Mint token to user1 and list it
      mintCarbonCredit(user1);
      listTokenForSale(1, 1000, user1);

      // Transfer token to user2 (so user1 no longer owns it)
      simnet.callPublicFn(
        "CarbonCredits",
        "transfer",
        [Cl.uint(1), Cl.principal(user2)],
        user1
      );

      // Try to purchase - should fail because seller doesn't own it anymore
      const result = simnet.callPublicFn(
        "CarbonMarketplace",
        "buy-carbon-credit",
        [Cl.uint(1)],
        user2
      );

      expect(result.result).toBeErr(Cl.uint(500)); // Owner != seller
    });

    it("fails when buyer is the seller", () => {
      mintCarbonCredit(user1);
      listTokenForSale(1, 1000, user1);

      const result = simnet.callPublicFn(
        "CarbonMarketplace",
        "buy-carbon-credit",
        [Cl.uint(1)],
        user1 // user1 trying to buy their own token
      );

      expect(result.result).toBeErr(Cl.uint(501)); // Buyer == seller
    });

    it("accumulates multiple sales in stats", () => {
      // First sale
      mintCarbonCredit(user1);
      listTokenForSale(1, 1000, user1);
      const result1 = simnet.callPublicFn("CarbonMarketplace", "buy-carbon-credit", [Cl.uint(1)], user2);
      expect(result1.result).toBeOk(Cl.uint(1));

      // Second sale
      mintCarbonCredit(user1);
      listTokenForSale(2, 2000, user1);
      const result2 = simnet.callPublicFn("CarbonMarketplace", "buy-carbon-credit", [Cl.uint(2)], user2);
      expect(result2.result).toBeOk(Cl.uint(2));

      // Check cumulative stats
      const statsResult = simnet.callReadOnlyFn(
        "CarbonMarketplace",
        "get-marketplace-stats",
        [],
        user2
      );

      expect(statsResult.result).toBeOk(
        Cl.tuple({
          "total-sales": Cl.uint(2),
          "total-volume": Cl.uint(3000) // 1000 + 2000
        })
      );
    });
  });

  describe("make-offer function", () => {
    it("accepts valid offers", () => {
      mintCarbonCredit(user1);

      const result = simnet.callPublicFn(
        "CarbonMarketplace",
        "make-offer",
        [Cl.uint(1), Cl.uint(500)],
        user2
      );

      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("fails when offer price is zero", () => {
      mintCarbonCredit(user1);

      const result = simnet.callPublicFn(
        "CarbonMarketplace",
        "make-offer",
        [Cl.uint(1), Cl.uint(0)],
        user2
      );

      expect(result.result).toBeErr(Cl.uint(600)); // Invalid offer price
    });

    it("accepts any positive offer price", () => {
      mintCarbonCredit(user1);

      const result = simnet.callPublicFn(
        "CarbonMarketplace",
        "make-offer",
        [Cl.uint(1), Cl.uint(1)], // Very low but valid price
        user2
      );

      expect(result.result).toBeOk(Cl.bool(true));
    });
  });

  describe("get-marketplace-stats function", () => {
    it("returns initial zero stats", () => {
      const result = simnet.callReadOnlyFn(
        "CarbonMarketplace",
        "get-marketplace-stats",
        [],
        user1
      );

      expect(result.result).toBeOk(
        Cl.tuple({
          "total-sales": Cl.uint(0),
          "total-volume": Cl.uint(0)
        })
      );
    });

    it("returns updated stats after purchases", () => {
      // Make some sales
      mintCarbonCredit(user1);
      listTokenForSale(1, 1500, user1);
      simnet.callPublicFn("CarbonMarketplace", "buy-carbon-credit", [Cl.uint(1)], user2);

      mintCarbonCredit(user1);
      listTokenForSale(2, 2500, user1);
      simnet.callPublicFn("CarbonMarketplace", "buy-carbon-credit", [Cl.uint(2)], user2);

      const result = simnet.callReadOnlyFn(
        "CarbonMarketplace",
        "get-marketplace-stats",
        [],
        user1
      );

      expect(result.result).toBeOk(
        Cl.tuple({
          "total-sales": Cl.uint(2),
          "total-volume": Cl.uint(4000) // 1500 + 2500
        })
      );
    });
  });

  describe("error code validation", () => {
    it("tests u300 error (listing not found)", () => {
      mintCarbonCredit(user1); // Token exists but not listed

      const result = simnet.callPublicFn(
        "CarbonMarketplace",
        "buy-carbon-credit",
        [Cl.uint(1)],
        user2
      );

      expect(result.result).toBeErr(Cl.uint(300));
    });

    it("tests u500 error (owner != seller)", () => {
      mintCarbonCredit(user1);
      listTokenForSale(1, 1000, user1);
      
      // Transfer ownership away from seller
      simnet.callPublicFn("CarbonCredits", "transfer", [Cl.uint(1), Cl.principal(user2)], user1);

      const result = simnet.callPublicFn(
        "CarbonMarketplace",
        "buy-carbon-credit",
        [Cl.uint(1)],
        user2
      );

      expect(result.result).toBeErr(Cl.uint(500));
    });

    it("tests u501 error (buyer == seller)", () => {
      mintCarbonCredit(user1);
      listTokenForSale(1, 1000, user1);

      const result = simnet.callPublicFn(
        "CarbonMarketplace",
        "buy-carbon-credit",
        [Cl.uint(1)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(501));
    });

    it("tests u600 error (invalid offer price)", () => {
      const result = simnet.callPublicFn(
        "CarbonMarketplace",
        "make-offer",
        [Cl.uint(1), Cl.uint(0)],
        user2
      );

      expect(result.result).toBeErr(Cl.uint(600));
    });
  });
});
