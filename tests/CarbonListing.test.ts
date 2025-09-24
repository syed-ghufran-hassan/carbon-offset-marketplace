import { Cl } from "@stacks/transactions";
import { describe, it, expect } from "vitest";

describe("Carbon Listing", () => {
  it("calls mint and logs result", () => {
    const deployer = simnet.getAccounts().get("deployer")!;

    const result = simnet.callPublicFn(
      "CarbonCreditEvents",
      "mint",
      [Cl.standardPrincipal(deployer), Cl.uint(100)],
      deployer
    );

    console.log("=== RAW RESULT ===");
    console.log(JSON.stringify(result, null, 2));

    expect(result).toBeDefined();
  });
});
