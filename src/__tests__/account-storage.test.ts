import { describe, expect, it } from "vitest";
import { accountStorageKey } from "@/lib/account-storage";

describe("account-scoped browser storage", () => {
  it("gives two accounts on the same browser different keys", () => {
    expect(accountStorageKey("pp_studio_draft", "user-a")).not.toBe(accountStorageKey("pp_studio_draft", "user-b"));
  });

  it("keeps the legacy unscoped key until the user claims it", () => {
    expect(accountStorageKey("pp_studio_draft")).toBe("pp_studio_draft");
  });
});
