import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer") as string;
const user1 = accounts.get("wallet_1") as string;
const user2 = accounts.get("wallet_2") as string;

describe("Carbon Credit Events", () => {
  it("logs mint event with correct parameters", () => {
    const amount = 100;
    const result = simnet.callPublicFn(
      "CarbonCreditEvents",
      "mint",
      [Cl.principal(user1), Cl.uint(amount)],
      deployer
    );

    expect(result.result).toBeOk(Cl.bool(true));
    expect(result.events.length).toBe(1);
    
    const event = result.events[0];
    expect(event.event).toBe("print_event");
    
    const eventData = event.data.value.value;
    expect(eventData.event.value).toBe("mint");
    expect(eventData.to.value).toBe(user1);
    expect(eventData.amount.value).toBe(BigInt(amount)); // Compare BigInt to BigInt
  });

  it("logs retire event with purpose", () => {
    const tokenId = 1;
    const purpose = "Carbon offset for company emissions";
    
    const result = simnet.callPublicFn(
      "CarbonCreditEvents",
      "retire",
      [Cl.uint(tokenId), Cl.principal(user1), Cl.stringUtf8(purpose)],
      user1
    );

    expect(result.result).toBeOk(Cl.bool(true));
    expect(result.events.length).toBe(1);
    
    const event = result.events[0];
    expect(event.event).toBe("print_event");
    
    const eventData = event.data.value.value;
    expect(eventData.event.value).toBe("retire");
    expect(eventData["token-id"].value).toBe(BigInt(tokenId)); // Compare BigInt to BigInt
    expect(eventData.by.value).toBe(user1);
    expect(eventData.purpose.value).toBe(purpose);
  });

  it("logs list-token event with price", () => {
    const tokenId = 1;
    const price = 5000;
    
    const result = simnet.callPublicFn(
      "CarbonCreditEvents",
      "list-token",
      [Cl.uint(tokenId), Cl.uint(price), Cl.principal(user1)],
      user1
    );

    expect(result.result).toBeOk(Cl.bool(true));
    expect(result.events.length).toBe(1);
    
    const event = result.events[0];
    expect(event.event).toBe("print_event");
    
    const eventData = event.data.value.value;
    expect(eventData.event.value).toBe("list");
    expect(eventData["token-id"].value).toBe(BigInt(tokenId)); // Compare BigInt to BigInt
    expect(eventData.price.value).toBe(BigInt(price)); // Compare BigInt to BigInt
    expect(eventData.seller.value).toBe(user1);
  });

  it("logs purchase event with transfer details", () => {
    const tokenId = 1;
    const price = 5000;
    
    const result = simnet.callPublicFn(
      "CarbonCreditEvents",
      "purchase",
      [
        Cl.uint(tokenId),
        Cl.principal(user1),
        Cl.principal(user2),
        Cl.uint(price)
      ],
      user2
    );

    expect(result.result).toBeOk(Cl.bool(true));
    expect(result.events.length).toBe(1);
    
    const event = result.events[0];
    expect(event.event).toBe("print_event");
    
    const eventData = event.data.value.value;
    expect(eventData.event.value).toBe("purchase");
    expect(eventData["token-id"].value).toBe(BigInt(tokenId)); // Compare BigInt to BigInt
    expect(eventData.from.value).toBe(user1);
    expect(eventData.to.value).toBe(user2);
    expect(eventData.price.value).toBe(BigInt(price)); // Compare BigInt to BigInt
  });

  it("handles empty purpose string", () => {
    const result = simnet.callPublicFn(
      "CarbonCreditEvents",
      "retire",
      [Cl.uint(1), Cl.principal(user1), Cl.stringUtf8("")],
      user1
    );
    
    expect(result.result).toBeOk(Cl.bool(true));
    expect(result.events.length).toBe(1);
    
    const eventData = result.events[0].data.value.value;
    expect(eventData.purpose.value).toBe("");
  });

  it("handles multiple events in sequence", () => {
    // Test mint
    const mintResult = simnet.callPublicFn(
      "CarbonCreditEvents",
      "mint",
      [Cl.principal(user1), Cl.uint(200)],
      deployer
    );
    expect(mintResult.result).toBeOk(Cl.bool(true));
    
    // Test list
    const listResult = simnet.callPublicFn(
      "CarbonCreditEvents", 
      "list-token",
      [Cl.uint(1), Cl.uint(3000), Cl.principal(user1)],
      user1
    );
    expect(listResult.result).toBeOk(Cl.bool(true));
    
    // Verify mint event
    const mintEventData = mintResult.events[0].data.value.value;
    expect(mintEventData.event.value).toBe("mint");
    expect(mintEventData.amount.value).toBe(BigInt(200)); // Compare BigInt to BigInt
    
    // Verify list event  
    const listEventData = listResult.events[0].data.value.value;
    expect(listEventData.event.value).toBe("list");
    expect(listEventData.price.value).toBe(BigInt(3000)); // Compare BigInt to BigInt
  });

  // Alternative approach: convert to string for comparison if preferred
  it("logs events with string comparison approach", () => {
    const amount = 100;
    const result = simnet.callPublicFn(
      "CarbonCreditEvents",
      "mint",
      [Cl.principal(user1), Cl.uint(amount)],
      deployer
    );

    expect(result.result).toBeOk(Cl.bool(true));
    
    const eventData = result.events[0].data.value.value;
    expect(eventData.event.value).toBe("mint");
    expect(eventData.to.value).toBe(user1);
    expect(eventData.amount.value.toString()).toBe(amount.toString()); // Convert both to string
  });
});

it("handles large amount values", () => {
  const largeAmount = 1000000;
  const result = simnet.callPublicFn(
    "CarbonCreditEvents",
    "mint",
    [Cl.principal(user1), Cl.uint(largeAmount)],
    deployer
  );
  expect(result.result).toBeOk(Cl.bool(true));
  // Would verify the event contains the large amount
});

it("handles maximum length purpose strings", () => {
  const longPurpose = "a".repeat(100); // Matches your (string-utf8 100) limit
  const result = simnet.callPublicFn(
    "CarbonCreditEvents",
    "retire",
    [Cl.uint(1), Cl.principal(user1), Cl.stringUtf8(longPurpose)],
    user1
  );
  expect(result.result).toBeOk(Cl.bool(true));
});
