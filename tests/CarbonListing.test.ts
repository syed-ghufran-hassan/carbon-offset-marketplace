import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer") as string;
const user1 = accounts.get("wallet_1") as string;
const user2 = accounts.get("wallet_2") as string;

describe("Carbon Listing Contract", () => {
  // Helper function to mint a carbon credit
  const mintCarbonCredit = (owner: string) => {
    return simnet.callPublicFn(
      "CarbonCredits",
      "mint",
      [Cl.principal(owner), Cl.stringUtf8("Test Project"), Cl.stringUtf8("Test Location"), Cl.uint(100)],
      deployer
    );
  };

  describe("list-for-sale function", () => {
    it("successfully lists a carbon credit for sale", () => {
      const mintResult = mintCarbonCredit(user1);
      expect(mintResult.result).toBeOk(Cl.uint(1));

      const listResult = simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(5000)],
        user1
      );

      expect(listResult.result).toBeOk(Cl.uint(1));

      // Verify the listing was created
      const listingResult = simnet.callReadOnlyFn(
        "CarbonListing",
        "get-listing",
        [Cl.uint(1)],
        user1
      );

      expect(listingResult.result).toBeSome(
        Cl.tuple({
          seller: Cl.principal(user1),
          price: Cl.uint(5000)
        })
      );
    });

    it("fails when listing non-existent token", () => {
      const result = simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(999), Cl.uint(5000)],
        user1
      );

      // Fixed: Should be u204 (unwrap of none owner) instead of u203
      expect(result.result).toBeErr(Cl.uint(204));
    });

    it("fails when non-owner tries to list", () => {
      mintCarbonCredit(user1);

      const result = simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(5000)],
        user2
      );

      expect(result.result).toBeErr(Cl.uint(200));
    });

    it("fails when price is zero", () => {
      mintCarbonCredit(user1);

      const result = simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(0)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(999));
    });

    it("fails when token is already listed", () => {
      mintCarbonCredit(user1);

      // First listing should succeed
      const firstList = simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(3000)],
        user1
      );
      expect(firstList.result).toBeOk(Cl.uint(1));

      // Second listing should fail
      const secondList = simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(4000)],
        user1
      );

      expect(secondList.result).toBeErr(Cl.uint(201));
    });
  });

  describe("get-listing function", () => {
    it("returns listing details for listed token", () => {
      mintCarbonCredit(user1);
      
      simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(2500)],
        user1
      );

      const result = simnet.callReadOnlyFn(
        "CarbonListing",
        "get-listing",
        [Cl.uint(1)],
        user1
      );

      expect(result.result).toBeSome(
        Cl.tuple({
          seller: Cl.principal(user1),
          price: Cl.uint(2500)
        })
      );
    });

    it("returns none for non-listed token", () => {
      mintCarbonCredit(user1);

      const result = simnet.callReadOnlyFn(
        "CarbonListing",
        "get-listing",
        [Cl.uint(1)],
        user1
      );

      expect(result.result).toBeNone();
    });

    it("returns none for non-existent token", () => {
      const result = simnet.callReadOnlyFn(
        "CarbonListing",
        "get-listing",
        [Cl.uint(999)],
        user1
      );

      expect(result.result).toBeNone();
    });
  });

  describe("cancel-listing function", () => {
    it("successfully cancels a listing", () => {
      mintCarbonCredit(user1);
      
      simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(3500)],
        user1
      );

      const cancelResult = simnet.callPublicFn(
        "CarbonListing",
        "cancel-listing",
        [Cl.uint(1)],
        user1
      );

      expect(cancelResult.result).toBeOk(Cl.uint(1));

      // Verify listing was removed
      const listingResult = simnet.callReadOnlyFn(
        "CarbonListing",
        "get-listing",
        [Cl.uint(1)],
        user1
      );
      expect(listingResult.result).toBeNone();
    });

    it("fails when canceling non-listed token", () => {
      mintCarbonCredit(user1);

      const result = simnet.callPublicFn(
        "CarbonListing",
        "cancel-listing",
        [Cl.uint(1)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(400));
    });

    it("fails when non-seller tries to cancel", () => {
      mintCarbonCredit(user1);
      
      simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(2000)],
        user1
      );

      const result = simnet.callPublicFn(
        "CarbonListing",
        "cancel-listing",
        [Cl.uint(1)],
        user2
      );

      expect(result.result).toBeErr(Cl.uint(402));
    });
  });

  describe("update-listing function", () => {
    it("successfully updates listing price", () => {
      mintCarbonCredit(user1);
      
      simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(1500)],
        user1
      );

      const updateResult = simnet.callPublicFn(
        "CarbonListing",
        "update-listing",
        [Cl.uint(1), Cl.uint(2000)],
        user1
      );

      expect(updateResult.result).toBeOk(Cl.uint(1));

      // Verify price was updated
      const listingResult = simnet.callReadOnlyFn(
        "CarbonListing",
        "get-listing",
        [Cl.uint(1)],
        user1
      );

      expect(listingResult.result).toBeSome(
        Cl.tuple({
          seller: Cl.principal(user1),
          price: Cl.uint(2000)
        })
      );
    });

    it("fails when updating non-listed token", () => {
      mintCarbonCredit(user1);

      const result = simnet.callPublicFn(
        "CarbonListing",
        "update-listing",
        [Cl.uint(1), Cl.uint(2000)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(403));
    });

    it("fails when non-seller tries to update", () => {
      mintCarbonCredit(user1);
      
      simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(1800)],
        user1
      );

      const result = simnet.callPublicFn(
        "CarbonListing",
        "update-listing",
        [Cl.uint(1), Cl.uint(2200)],
        user2
      );

      expect(result.result).toBeErr(Cl.uint(405));
    });

    it("fails when new price is zero", () => {
      mintCarbonCredit(user1);
      
      simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(1200)],
        user1
      );

      const result = simnet.callPublicFn(
        "CarbonListing",
        "update-listing",
        [Cl.uint(1), Cl.uint(0)],
        user1
      );

      expect(result.result).toBeErr(Cl.uint(998));
    });
  });

  describe("delist-token function", () => {
    it("successfully delists a token", () => {
      mintCarbonCredit(user1);
      
      simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(3000)],
        user1
      );

      const delistResult = simnet.callPublicFn(
        "CarbonListing",
        "delist-token",
        [Cl.uint(1)],
        deployer
      );

      expect(delistResult.result).toBeOk(Cl.bool(true));

      // Verify listing was removed
      const listingResult = simnet.callReadOnlyFn(
        "CarbonListing",
        "get-listing",
        [Cl.uint(1)],
        user1
      );
      expect(listingResult.result).toBeNone();
    });

    it("fails when delisting non-listed token", () => {
      mintCarbonCredit(user1);

      const result = simnet.callPublicFn(
        "CarbonListing",
        "delist-token",
        [Cl.uint(1)],
        deployer
      );

      expect(result.result).toBeErr(Cl.uint(300));
    });

    it("allows anyone to delist (not just owner)", () => {
      mintCarbonCredit(user1);
      
      simnet.callPublicFn(
        "CarbonListing",
        "list-for-sale",
        [Cl.uint(1), Cl.uint(2500)],
        user1
      );

      // user2 (not the owner) can still delist
      const result = simnet.callPublicFn(
        "CarbonListing",
        "delist-token",
        [Cl.uint(1)],
        user2
      );

      expect(result.result).toBeOk(Cl.bool(true));
    });
  });
});
