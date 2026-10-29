import { describe, it, expect, vi } from "vitest";
import {
  requirePermission,
  requireSuperAdmin,
  requireDirectLogin,
  requireSsoLogin,
  requireRole,
} from "./rbac.middleware";
import { UnauthorizedError, ForbiddenError } from "../shared/errors";
import { AccessTokenPayload } from "../modules/auth/auth.types";

function mockRequest(user?: Partial<AccessTokenPayload> & { id?: string }) {
  return {
    user,
  } as any;
}

function mockResponse() {
  return {} as any;
}

describe("RBAC Middleware Guards", () => {
  describe("requirePermission", () => {
    it("calls next with UnauthorizedError if req.user is undefined", () => {
      const middleware = requirePermission("dashboard", "view");
      const req = mockRequest(undefined);
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.message).toBe("Authentication required");
    });

    it("calls next with ForbiddenError if user's role lacks the permission", () => {
      // Auditor cannot configure auto_discovery_config
      const middleware = requirePermission("auto_discovery_config", "configure");
      const req = mockRequest({
        id: "user-1",
        role: "auditor",
        email: "auditor@corp.com",
        tenantId: null,
      });
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.message).toContain("Access denied: role 'auditor' does not have 'configure' on 'auto_discovery_config'");
    });

    it("calls next without error when user's role has the permission", () => {
      // Admin can configure auto_discovery_config
      const middleware = requirePermission("auto_discovery_config", "configure");
      const req = mockRequest({
        id: "user-2",
        role: "admin",
        email: "admin@corp.com",
        tenantId: null,
      });
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // no argument means success
    });
  });

  describe("requireSuperAdmin", () => {
    it("calls next with UnauthorizedError if user is missing", () => {
      const middleware = requireSuperAdmin();
      const req = mockRequest(undefined);
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it("calls next with ForbiddenError if user role is not super_admin", () => {
      const middleware = requireSuperAdmin();
      const req = mockRequest({
        id: "user-admin",
        role: "admin",
      });
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.message).toBe("Super Admin access required");
    });

    it("calls next without error when user is super_admin", () => {
      const middleware = requireSuperAdmin();
      const req = mockRequest({
        id: "user-super",
        role: "super_admin",
      });
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("requireDirectLogin", () => {
    it("calls next with UnauthorizedError if user is missing", () => {
      const middleware = requireDirectLogin();
      const req = mockRequest(undefined);
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it("rejects SSO authenticated users", () => {
      const middleware = requireDirectLogin();
      const req = mockRequest({
        id: "user-1",
        authMethod: "microsoft" as any,
      });
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.message).toBe("This operation requires direct login authentication");
    });

    it("allows password (direct login) authenticated users", () => {
      const middleware = requireDirectLogin();
      const req = mockRequest({
        id: "user-1",
        authMethod: "password",
      });
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("requireSsoLogin", () => {
    it("calls next with UnauthorizedError if user is missing", () => {
      const middleware = requireSsoLogin();
      const req = mockRequest(undefined);
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it("rejects direct username/password authenticated users", () => {
      const middleware = requireSsoLogin();
      const req = mockRequest({
        id: "user-1",
        authMethod: "password",
      });
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.message).toBe("This operation requires SSO authentication");
    });

    it("allows SSO authenticated users", () => {
      const middleware = requireSsoLogin();
      const req = mockRequest({
        id: "user-1",
        authMethod: "microsoft" as any,
      });
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("requireRole", () => {
    it("calls next with UnauthorizedError if user is missing", () => {
      const middleware = requireRole("admin", "super_admin");
      const req = mockRequest(undefined);
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it("calls next with ForbiddenError if role is not in the allowed list", () => {
      const middleware = requireRole("super_admin", "admin");
      const req = mockRequest({
        id: "user-1",
        role: "auditor",
      });
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.message).toBe("Insufficient permissions");
    });

    it("calls next without error if user role matches one of allowed roles", () => {
      const middleware = requireRole("ciso", "security_analyst");
      const req = mockRequest({
        id: "user-1",
        role: "ciso",
      });
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
