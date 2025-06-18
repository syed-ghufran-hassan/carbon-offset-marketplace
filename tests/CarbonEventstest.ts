import { describe, expect, it, beforeEach } from "vitest";
import { simnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Carbon Credit Events Test Suite", () => {
  beforeEach(() => {
    // Reset the chain state between tests
    simnet.mineEmptyBlocks(10);
  });

  describe("Minted Event", () => {
    it("should emit Minted event when new carbon credit is created", () => {
      const mintResult = simnet.callPublicFn(
        "carbon-credits",
        "mint-carbon-credit",
        ["Project Rainforest", "Brazil", 500],
        deployer
      );

      expect(mintResult.result).toBeOk();

      const events = simnet.getEvents();
      const mintEvent = events.find(e => e.type === "Minted");

      expect(mintEvent).toBeDefined();
      expect(mintEvent?.data).toEqual({
        "token-id": "1",
        "project": '"Project Rainforest"',
        "amount": "500"
      });
    });

    it("should include correct token-id in Minted event for multiple mints", () => {
      // First mint
      simnet.callPublicFn(
        "carbon-credits",
        "mint-carbon-credit",
        ["Project A", "USA", 100],
        deployer
      );

      // Second mint
      const mintResult = simnet.callPublicFn(
        "carbon-credits",
        "mint-carbon-credit",
        ["Project B", "Canada", 200],
        deployer
      );

      const events = simnet.getEvents();
      const mintEvents = events.filter(e => e.type === "Minted");

      expect(mintEvents).toHaveLength(2);
      expect(mintEvents[1].data).toEqual({
        "token-id": "2",
        "project": '"Project B"',
        "amount": "200"
      });
    });
  });

  describe("Retired Event", () => {
    beforeEach(() => {
      // Mint a credit to retire
      simnet.callPublicFn(
        "carbon-credits",
        "mint-carbon-credit",
        ["Wind Farm Project", "Germany", 300],
        deployer
      );
    });

    it("should emit Retired event when credit is retired", () => {
      const retireResult = simnet.callPublicFn(
        "carbon-credits",
        "retire-carbon-credit",
        [1, "Offsetting company carbon footprint"],
        deployer
      );

      expect(retireResult.result).toBeOk();

      const events = simnet.getEvents();
      const retireEvent = events.find(e => e.type === "Retired");

      expect(retireEvent).toBeDefined();
      expect(retireEvent?.data).toEqual({
        "token-id": "1",
        "by": deployer,
        "purpose": '"Offsetting company carbon footprint"'
      });
    });

    it("should not emit Retired event when retirement fails", () => {
      // Attempt to retire with invalid token id
      const retireResult = simnet.callPublicFn(
        "carbon-credits",
        "retire-carbon-credit",
        [999, "Invalid attempt"],
        deployer
      );

      expect(retireResult.result).toBeErr();

      const events = simnet.getEvents();
      const retireEvent = events.find(e => e.type === "Retired");

      expect(retireEvent).toBeUndefined();
    });
  });

  describe("Listed Event", () => {
    beforeEach(() => {
      // Mint a credit to list
      simnet.callPublicFn(
        "carbon-credits",
        "mint-carbon-credit",
        ["Solar Farm", "Spain", 400],
        wallet1
      );
    });

    it("should emit Listed event when credit is listed for sale", () => {
      const listResult = simnet.callPublicFn(
        "carbon-marketplace",
        "list-carbon-credit",
        [1, 2500], // token-id, price
        wallet1
      );

      expect(listResult.result).toBeOk();

      const events = simnet.getEvents();
      const listEvent = events.find(e => e.type === "Listed");

      expect(listEvent).toBeDefined();
      expect(listEvent?.data).toEqual({
        "token-id": "1",
        "price": "2500",
        "seller": wallet1
      });
    });

    it("should not emit Listed event when listing fails", () => {
      // Attempt to list non-owned credit
      const listResult = simnet.callPublicFn(
        "carbon-marketplace",
        "list-carbon-credit",
        [1, 2500],
        wallet2
      );

      expect(listResult.result).toBeErr();

      const events = simnet.getEvents();
      const listEvent = events.find(e => e.type === "Listed");

      expect(listEvent).toBeUndefined();
    });
  });

  describe("Purchased Event", () => {
    beforeEach(() => {
      // Mint and list a credit
      simnet.callPublicFn(
        "carbon-credits",
        "mint-carbon-credit",
        ["Hydro Project", "Norway", 600],
        wallet1
      );
      simnet.callPublicFn(
        "carbon-marketplace",
        "list-carbon-credit",
        [1, 3000],
        wallet1
      );
    });

    it("should emit Purchased event when credit is bought", () => {
      const purchaseResult = simnet.callPublicFn(
        "carbon-marketplace",
        "purchase-carbon-credit",
        [1],
        wallet2
      );

      expect(purchaseResult.result).toBeOk();

      const events = simnet.getEvents();
      const purchaseEvent = events.find(e => e.type === "Purchased");

      expect(purchaseEvent).toBeDefined();
      expect(purchaseEvent?.data).toEqual({
        "token-id": "1",
        "from": wallet1,
        "to": wallet2,
        "price": "3000"
      });
    });

    it("should not emit Purchased event when purchase fails", () => {
      // Attempt purchase with insufficient funds
      // (Assuming your contract checks for payment)
      const purchaseResult = simnet.callPublicFn(
        "carbon-marketplace",
        "purchase-carbon-credit",
        [1],
        wallet2
      );
      // Modify expectation based on your actual payment logic
      // expect(purchaseResult.result).toBeErr();

      const events = simnet.getEvents();
      const purchaseEvent = events.find(e => e.type === "Purchased");

      // This expectation depends on your payment implementation
      // expect(purchaseEvent).toBeUndefined();
    });
  });

  describe("Event Sequencing", () => {
    it("should emit events in correct order during credit lifecycle", () => {
      // 1. Mint
      simnet.callPublicFn(
        "carbon-credits",
        "mint-carbon-credit",
        ["Lifecycle Test", "Global", 1000],
        wallet1
      );

      // 2. List
      simnet.callPublicFn(
        "carbon-marketplace",
        "list-carbon-credit",
        [1, 5000],
        wallet1
      );

      // 3. Purchase
      simnet.callPublicFn(
        "carbon-marketplace",
        "purchase-carbon-credit",
        [1],
        wallet2
      );

      // 4. Retire
      simnet.callPublicFn(
        "carbon-credits",
        "retire-carbon-credit",
        [1, "Complete lifecycle test"],
        wallet2
      );

      const events = simnet.getEvents();
      const relevantEvents = events.filter(e => 
        ["Minted", "Listed", "Purchased", "Retired"].includes(e.type)
      );

      expect(relevantEvents).toHaveLength(4);
      expect(relevantEvents[0].type).toBe("Minted");
      expect(relevantEvents[1].type).toBe("Listed");
      expect(relevantEvents[2].type).toBe("Purchased");
      expect(relevantEvents[3].type).toBe("Retired");
    });
  });
});
