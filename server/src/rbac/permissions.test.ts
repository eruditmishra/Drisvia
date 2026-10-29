import { describe, it, expect } from "vitest";
import {
  hasPermission,
  getAccessibleResources,
  getAllowedActions,
  isValidRole,
  DIRECT_LOGIN_ROLES,
  SSO_ONLY_ROLES,
  ROLE_PERMISSIONS,
  Role,
  Resource,
  Action,
} from "./permissions";

describe("RBAC Permissions Registry", () => {
  describe("Role Partitioning", () => {
    it("DIRECT_LOGIN_ROLES contains only super_admin", () => {
      expect(DIRECT_LOGIN_ROLES).toEqual(["super_admin"]);
    });

    it("SSO_ONLY_ROLES contains admin, ciso, security_analyst, and auditor", () => {
      expect(SSO_ONLY_ROLES).toEqual([
        "admin",
        "ciso",
        "security_analyst",
        "auditor",
      ]);
    });

    it("DIRECT_LOGIN_ROLES and SSO_ONLY_ROLES are mutually disjoint and cover all roles", () => {
      const allRoles = Object.keys(ROLE_PERMISSIONS) as Role[];
      const combined = [...DIRECT_LOGIN_ROLES, ...SSO_ONLY_ROLES];

      expect(combined.length).toBe(allRoles.length);
      expect(new Set(combined).size).toBe(allRoles.length);
      expect(new Set(combined)).toEqual(new Set(allRoles));
    });
  });

  describe("isValidRole", () => {
    it("returns true for all 5 defined roles", () => {
      expect(isValidRole("super_admin")).toBe(true);
      expect(isValidRole("admin")).toBe(true);
      expect(isValidRole("ciso")).toBe(true);
      expect(isValidRole("security_analyst")).toBe(true);
      expect(isValidRole("auditor")).toBe(true);
    });

    it("returns false for invalid or legacy role strings", () => {
      expect(isValidRole("member")).toBe(false);
      expect(isValidRole("user")).toBe(false);
      expect(isValidRole("super-admin")).toBe(false);
      expect(isValidRole("analyst")).toBe(false);
      expect(isValidRole("guest")).toBe(false);
      expect(isValidRole("root")).toBe(false);
      expect(isValidRole("")).toBe(false);
    });
  });

  describe("hasPermission - Role boundaries and least privilege", () => {
    describe("super_admin", () => {
      it("can perform all administrative, approval, and management actions", () => {
        expect(hasPermission("super_admin", "dashboard", "view")).toBe(true);
        expect(hasPermission("super_admin", "agents", "create")).toBe(true);
        expect(hasPermission("super_admin", "agents", "delete")).toBe(true);
        expect(hasPermission("super_admin", "agents", "approve")).toBe(true);
        expect(hasPermission("super_admin", "sso_config", "configure")).toBe(true);
        expect(hasPermission("super_admin", "auto_discovery_config", "configure")).toBe(true);
        expect(hasPermission("super_admin", "user_management", "invite")).toBe(true);
        expect(hasPermission("super_admin", "manual_approval", "approve")).toBe(true);
      });
    });

    describe("admin", () => {
      it("can manage agents and auto-discovery, but CANNOT configure SSO or perform manual approvals", () => {
        expect(hasPermission("admin", "dashboard", "view")).toBe(true);
        expect(hasPermission("admin", "agents", "view")).toBe(true);
        expect(hasPermission("admin", "agents", "manage")).toBe(true);
        expect(hasPermission("admin", "auto_discovery_config", "configure")).toBe(true);
        expect(hasPermission("admin", "auto_discovery_config", "enable")).toBe(true);

        // Security boundary: admin is barred from SSO config and manual approvals
        expect(hasPermission("admin", "sso_config", "view")).toBe(false);
        expect(hasPermission("admin", "sso_config", "configure")).toBe(false);
        expect(hasPermission("admin", "manual_approval", "approve")).toBe(false);
        expect(hasPermission("admin", "agents", "approve")).toBe(false);
      });
    });

    describe("ciso", () => {
      it("can view visibility dashboards and approve agents, but CANNOT configure discovery or user accounts", () => {
        expect(hasPermission("ciso", "dashboard", "view")).toBe(true);
        expect(hasPermission("ciso", "agents", "view")).toBe(true);
        expect(hasPermission("ciso", "agents", "approve")).toBe(true);
        expect(hasPermission("ciso", "models", "approve")).toBe(true);
        expect(hasPermission("ciso", "agent_audit_logs", "export")).toBe(true);

        // Security boundary: CISO does not manage user accounts or configure auto-discovery
        expect(hasPermission("ciso", "sso_config", "view")).toBe(false);
        expect(hasPermission("ciso", "auto_discovery_config", "configure")).toBe(false);
        expect(hasPermission("ciso", "user_management", "view")).toBe(false);
        expect(hasPermission("ciso", "scanning", "manage")).toBe(false);
      });
    });

    describe("security_analyst", () => {
      it("can view and update agents, but CANNOT approve agents or configure SSO", () => {
        expect(hasPermission("security_analyst", "dashboard", "view")).toBe(true);
        expect(hasPermission("security_analyst", "agents", "view")).toBe(true);
        expect(hasPermission("security_analyst", "agents", "update")).toBe(true);
        expect(hasPermission("security_analyst", "scanning", "view")).toBe(true);

        // Security boundary: cannot approve or configure infrastructure
        expect(hasPermission("security_analyst", "agents", "approve")).toBe(false);
        expect(hasPermission("security_analyst", "models", "approve")).toBe(false);
        expect(hasPermission("security_analyst", "sso_config", "view")).toBe(false);
        expect(hasPermission("security_analyst", "auto_discovery_config", "configure")).toBe(false);
      });
    });

    describe("auditor", () => {
      it("has read-only access and export on audit logs, and NO mutating or approval permissions", () => {
        expect(hasPermission("auditor", "dashboard", "view")).toBe(true);
        expect(hasPermission("auditor", "agents", "view")).toBe(true);
        expect(hasPermission("auditor", "discovery_results", "view")).toBe(true);
        expect(hasPermission("auditor", "agent_audit_logs", "view")).toBe(true);
        expect(hasPermission("auditor", "agent_audit_logs", "export")).toBe(true);

        // Security boundary: zero write, manage, approve, or configure capability
        expect(hasPermission("auditor", "agents", "update")).toBe(false);
        expect(hasPermission("auditor", "agents", "delete")).toBe(false);
        expect(hasPermission("auditor", "agents", "approve")).toBe(false);
        expect(hasPermission("auditor", "user_management", "view")).toBe(false);
        expect(hasPermission("auditor", "sso_config", "view")).toBe(false);
        expect(hasPermission("auditor", "auto_discovery_config", "view")).toBe(false);
        expect(hasPermission("auditor", "scanning", "view")).toBe(false);
      });
    });

    it("returns false for non-existent roles or invalid resource combinations", () => {
      expect(hasPermission("unknown_role", "dashboard", "view")).toBe(false);
      expect(hasPermission("", "dashboard", "view")).toBe(false);
      expect(
        hasPermission("super_admin", "non_existent_resource" as Resource, "view"),
      ).toBe(false);
      expect(
        hasPermission("super_admin", "dashboard", "non_existent_action" as Action),
      ).toBe(false);
    });
  });

  describe("getAccessibleResources", () => {
    it("returns all resources super_admin has access to", () => {
      const resources = getAccessibleResources("super_admin");
      expect(resources).toContain("dashboard");
      expect(resources).toContain("agents");
      expect(resources).toContain("sso_config");
      expect(resources).toContain("auto_discovery_config");
      expect(resources).toContain("user_management");
      expect(resources).toContain("manual_approval");
      expect(resources.length).toBe(14);
    });

    it("returns subset of resources for auditor excluding user_management, sso_config, scanning", () => {
      const resources = getAccessibleResources("auditor");
      expect(resources).toContain("dashboard");
      expect(resources).toContain("agents");
      expect(resources).toContain("discovery_results");
      expect(resources).toContain("agent_audit_logs");
      expect(resources).not.toContain("user_management");
      expect(resources).not.toContain("sso_config");
      expect(resources).not.toContain("auto_discovery_config");
      expect(resources).not.toContain("scanning");
    });

    it("returns empty array for invalid or missing role", () => {
      expect(getAccessibleResources("invalid_role")).toEqual([]);
      expect(getAccessibleResources("")).toEqual([]);
    });
  });

  describe("getAllowedActions", () => {
    it("returns allowed actions for a valid role + resource combination", () => {
      const actions = getAllowedActions("super_admin", "agents");
      expect(actions).toEqual([
        "view",
        "manage",
        "approve",
        "classify",
        "create",
        "update",
        "delete",
      ]);
    });

    it("returns empty array if the role has no access to the resource", () => {
      expect(getAllowedActions("auditor", "sso_config")).toEqual([]);
      expect(getAllowedActions("ciso", "user_management")).toEqual([]);
      expect(getAllowedActions("admin", "manual_approval")).toEqual([]);
    });

    it("returns empty array for an unknown role", () => {
      expect(getAllowedActions("guest", "dashboard")).toEqual([]);
    });
  });
});
