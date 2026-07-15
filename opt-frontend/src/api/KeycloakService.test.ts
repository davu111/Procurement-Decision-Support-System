import { describe, expect, it } from "vitest";
import { filterRoles } from "./KeycloakService";

describe("filterRoles", () => {
  it("keeps newly added application roles such as admin-manager", () => {
    expect(
      filterRoles([
        "admin-manager",
        "warehouse-manager",
        "planning-manager",
        "default-roles-optimization",
        "uma_authorization",
        "offline_access",
      ]),
    ).toEqual(["admin-manager", "warehouse-manager", "planning-manager"]);
  });
});
