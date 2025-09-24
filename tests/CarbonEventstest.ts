import { Cl } from "@stacks/transactions";
import { describe, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer") as string;

function mintCarbonCredit(amount: number, to: string) {
  return simnet.callPublicFn(
    "CarbonCreditEvents",
    "mint",
    [Cl.standardPrincipal(to), Cl.uint(amount)],
    deployer
  );
}

describe("Carbon Credit Events", () => {
  it("logs events for mint", () => {
    const mintResult = mintCarbonCredit(100, deployer);

    console.log("=== RAW RESULT ===");
    console.log(JSON.stringify(mintResult, null, 2));

    console.log("=== RAW EVENTS ===");
    console.log(JSON.stringify(mintResult.events, null, 2));
  });
});
