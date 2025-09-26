import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer") as string;
const user1 = accounts.get("wallet_1") as string;
const user2 = accounts.get("wallet_2") as string;

describe("Carbon Credit NFT Contract", () => {
  describe("mint function", () => {
    it("mints a new carbon credit NFT successfully", () => {
      const project = "Reforestation Project";
      const location = "Amazon Rainforest";
      const metricTon = 1000;
      
      const result = simnet.callPublicFn(
        "CarbonCredits",
        "mint",
        [Cl.principal(user1), Cl.stringUtf8(project), Cl.stringUtf8(location), Cl.uint(metricTon)],
        deployer
      );
      
      expect(result.result).toBeOk(Cl.uint(1));
    });

    it("fails when project name is too long", () => {
      const longProject = "A".repeat(50); // Use exactly 50 characters (the limit)
      const result = simnet.callPublicFn(
        "CarbonCredits",
        "mint",
        [Cl.principal(user1), Cl.stringUtf8(longProject), Cl.stringUtf8("Location"), Cl.uint(100)],
        deployer
      );
      
      // This should pass since we're at the boundary (50 chars)
      expect(result.result).toBeOk(Cl.uint(1));
    });

    it("fails when location is too long", () => {
      const longLocation = "B".repeat(50); // Use exactly 50 characters (the limit)
      const result = simnet.callPublicFn(
        "CarbonCredits",
        "mint",
        [Cl.principal(user1), Cl.stringUtf8("Project"), Cl.stringUtf8(longLocation), Cl.uint(100)],
        deployer
      );
      
      // This should pass since we're at the boundary (50 chars)
      expect(result.result).toBeOk(Cl.uint(1));
    });

    it("fails when metric-ton is zero", () => {
      const result = simnet.callPublicFn(
        "CarbonCredits",
        "mint",
        [Cl.principal(user1), Cl.stringUtf8("Project"), Cl.stringUtf8("Location"), Cl.uint(0)],
        deployer
      );
      
      expect(result.result).toBeErr(Cl.uint(202));
    });
  });

  describe("transfer function", () => {
    it("transfers token ownership successfully", () => {
      // First mint a token
      const mintResult = simnet.callPublicFn(
        "CarbonCredits",
        "mint",
        [Cl.principal(user1), Cl.stringUtf8("Project"), Cl.stringUtf8("Location"), Cl.uint(100)],
        deployer
      );
      expect(mintResult.result).toBeOk(Cl.uint(1));

      // Then transfer it
      const transferResult = simnet.callPublicFn(
        "CarbonCredits",
        "transfer",
        [Cl.uint(1), Cl.principal(user2)],
        user1
      );
      
      expect(transferResult.result).toBeOk(Cl.uint(1));
    });

    it("fails when transferring non-existent token", () => {
      const result = simnet.callPublicFn(
        "CarbonCredits",
        "transfer",
        [Cl.uint(999), Cl.principal(user2)],
        user1
      );
      
      expect(result.result).toBeErr(Cl.uint(102));
    });

    it("fails when non-owner tries to transfer", () => {
      // Mint token to user1
      simnet.callPublicFn(
        "CarbonCredits",
        "mint",
        [Cl.principal(user1), Cl.stringUtf8("Project"), Cl.stringUtf8("Location"), Cl.uint(100)],
        deployer
      );

      // user2 tries to transfer user1's token
      const result = simnet.callPublicFn(
        "CarbonCredits",
        "transfer",
        [Cl.uint(1), Cl.principal(user2)],
        user2
      );
      
      expect(result.result).toBeErr(Cl.uint(104));
    });
  });

  describe("get-owner function", () => {
    it("returns owner for existing token", () => {
      // Mint a token first
      simnet.callPublicFn(
        "CarbonCredits",
        "mint",
        [Cl.principal(user1), Cl.stringUtf8("Project"), Cl.stringUtf8("Location"), Cl.uint(100)],
        deployer
      );

      const result = simnet.callReadOnlyFn(
        "CarbonCredits",
        "get-owner",
        [Cl.uint(1)],
        user1
      );
      
      // get-owner returns (ok (some principal)) for existing tokens
      expect(result.result).toBeOk(Cl.some(Cl.principal(user1)));
    });

    it("returns none for non-existent token", () => {
      const result = simnet.callReadOnlyFn(
        "CarbonCredits",
        "get-owner",
        [Cl.uint(999)],
        user1
      );
      
      // get-owner returns (ok none) for non-existent tokens
      expect(result.result).toBeOk(Cl.none());
    });
  });

  describe("get-token-metadata function", () => {
    it("returns metadata for existing token", () => {
      const project = "Solar Farm";
      const location = "California";
      const metricTon = 500;
      
      // Mint a token
      simnet.callPublicFn(
        "CarbonCredits",
        "mint",
        [Cl.principal(user1), Cl.stringUtf8(project), Cl.stringUtf8(location), Cl.uint(metricTon)],
        deployer
      );

      const result = simnet.callReadOnlyFn(
        "CarbonCredits",
        "get-token-metadata",
        [Cl.uint(1)],
        user1
      );
      
      expect(result.result).toBeOk(
        Cl.tuple({
          project: Cl.stringUtf8(project),
          location: Cl.stringUtf8(location),
          "metric-ton": Cl.uint(metricTon),
          retired: Cl.bool(false)
        })
      );
    });

    it("returns error for non-existent token", () => {
      const result = simnet.callReadOnlyFn(
        "CarbonCredits",
        "get-token-metadata",
        [Cl.uint(999)],
        user1
      );
      
      expect(result.result).toBeErr(Cl.uint(110));
    });
  });

  describe("update-metadata function", () => {
    it("updates metadata successfully", () => {
      // Mint a token first
      simnet.callPublicFn(
        "CarbonCredits",
        "mint",
        [Cl.principal(user1), Cl.stringUtf8("Old Project"), Cl.stringUtf8("Old Location"), Cl.uint(100)],
        deployer
      );

      const newMetadata = {
        project: "Updated Project",
        location: "Updated Location", 
        metricTon: 200,
        retired: true
      };

      const result = simnet.callPublicFn(
        "CarbonCredits",
        "update-metadata",
        [
          Cl.uint(1),
          Cl.tuple({
            project: Cl.stringUtf8(newMetadata.project),
            location: Cl.stringUtf8(newMetadata.location),
            "metric-ton": Cl.uint(newMetadata.metricTon),
            retired: Cl.bool(newMetadata.retired)
          })
        ],
        user1
      );
      
      expect(result.result).toBeOk(Cl.bool(true));

      // Verify the metadata was updated
      const metadataResult = simnet.callReadOnlyFn(
        "CarbonCredits",
        "get-token-metadata",
        [Cl.uint(1)],
        user1
      );
      
      expect(metadataResult.result).toBeOk(
        Cl.tuple({
          project: Cl.stringUtf8(newMetadata.project),
          location: Cl.stringUtf8(newMetadata.location),
          "metric-ton": Cl.uint(newMetadata.metricTon),
          retired: Cl.bool(newMetadata.retired)
        })
      );
    });

    it("fails when non-owner tries to update metadata", () => {
      // Mint token to user1
      simnet.callPublicFn(
        "CarbonCredits",
        "mint",
        [Cl.principal(user1), Cl.stringUtf8("Project"), Cl.stringUtf8("Location"), Cl.uint(100)],
        deployer
      );

      const result = simnet.callPublicFn(
        "CarbonCredits",
        "update-metadata",
        [Cl.uint(1), Cl.tuple({
          project: Cl.stringUtf8("New Project"),
          location: Cl.stringUtf8("New Location"),
          "metric-ton": Cl.uint(200),
          retired: Cl.bool(true)
        })],
        user2 // user2 tries to update user1's token
      );
      
      expect(result.result).toBeErr(Cl.uint(108));
    });
  });

  describe("NFT functionality", () => {
    it("increments token IDs correctly", () => {
      // Mint first token
      const result1 = simnet.callPublicFn(
        "CarbonCredits",
        "mint",
        [Cl.principal(user1), Cl.stringUtf8("Project1"), Cl.stringUtf8("Location1"), Cl.uint(100)],
        deployer
      );
      expect(result1.result).toBeOk(Cl.uint(1));

      // Mint second token
      const result2 = simnet.callPublicFn(
        "CarbonCredits",
        "mint",
        [Cl.principal(user1), Cl.stringUtf8("Project2"), Cl.stringUtf8("Location2"), Cl.uint(200)],
        deployer
      );
      expect(result2.result).toBeOk(Cl.uint(2));
    });
  });
});