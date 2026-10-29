import { describe, it, expect, vi } from "vitest";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { errorHandler, notFoundHandler } from "./errorHandler.middleware";
import { BadRequestError, ForbiddenError, AppError } from "../errors";

function mockResponse() {
  const res: any = {};
  res.statusCode = 200;
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn().mockImplementation((data: any) => {
    res.body = data;
    return res;
  });
  return res;
}

function mockRequest(method = "GET", path = "/api/agents") {
  return {
    method,
    path,
  } as any;
}

describe("Global Error and 404 Handlers", () => {
  describe("errorHandler", () => {
    it("handles AppError instances and mirrors status code and code", () => {
      const err = new ForbiddenError("Cannot access this tenant");
      const req = mockRequest("POST", "/api/agents");
      const res = mockResponse();
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "FORBIDDEN",
        message: "Cannot access this tenant",
      });
    });

    it("includes details field in JSON when details are present on AppError", () => {
      const err = new BadRequestError("Validation failed", { field: "email" });
      const req = mockRequest();
      const res = mockResponse();
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "BAD_REQUEST",
        message: "Validation failed",
        details: { field: "email" },
      });
    });

    it("handles ZodError by returning 422 with formatted validation issues", () => {
      const zodError = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["body", "name"],
          message: "Expected string, received number",
        },
      ]);
      const req = mockRequest("PUT", "/api/models");
      const res = mockResponse();
      const next = vi.fn();

      errorHandler(zodError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        error: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: [
          {
            path: "body.name",
            message: "Expected string, received number",
          },
        ],
      });
    });

    it("handles JsonWebTokenError by returning 401 INVALID_OR_EXPIRED_TOKEN", () => {
      const jwtError = new jwt.JsonWebTokenError("invalid signature");
      const req = mockRequest();
      const res = mockResponse();
      const next = vi.fn();

      errorHandler(jwtError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "INVALID_OR_EXPIRED_TOKEN",
      });
    });

    it("handles TokenExpiredError by returning 401 INVALID_OR_EXPIRED_TOKEN", () => {
      const expiredError = new jwt.TokenExpiredError("jwt expired", new Date());
      const req = mockRequest();
      const res = mockResponse();
      const next = vi.fn();

      errorHandler(expiredError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "INVALID_OR_EXPIRED_TOKEN",
      });
    });

    it("handles Postgres unique constraint violation (code 23505) as 409 CONFLICT", () => {
      const pgError = {
        code: "23505",
        detail: "Key (email)=(admin@corp.com) already exists.",
      };
      const req = mockRequest("POST", "/api/users");
      const res = mockResponse();
      const next = vi.fn();

      errorHandler(pgError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "CONFLICT",
        message: "Resource already exists",
      });
    });

    it("handles Postgres foreign key constraint violation (code 23503) as 400 INVALID_REFERENCE", () => {
      const pgError = {
        code: "23503",
        detail: "Key (tenant_id)=(...) is not present in table tenants.",
      };
      const req = mockRequest();
      const res = mockResponse();
      const next = vi.fn();

      errorHandler(pgError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "INVALID_REFERENCE",
        message: "Referenced resource does not exist",
      });
    });

    it("handles unknown generic Error as 500 INTERNAL_SERVER_ERROR", () => {
      const genericError = new Error("Unexpected crash or connection dropped");
      const req = mockRequest();
      const res = mockResponse();
      const next = vi.fn();

      errorHandler(genericError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.body.error).toBe("INTERNAL_SERVER_ERROR");
      expect(res.body.message).toBe("Something went wrong");
    });
  });

  describe("notFoundHandler", () => {
    it("returns 404 with method and path", () => {
      const req = mockRequest("GET", "/api/unknown-endpoint");
      const res = mockResponse();

      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "NOT_FOUND",
        message: "No route for GET /api/unknown-endpoint",
      });
    });
  });
});
