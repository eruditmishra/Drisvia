import { describe, it, expect } from "vitest";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from "./errors";

describe("Custom Application Error Hierarchy", () => {
  it("initializes AppError with correct defaults and properties", () => {
    const err = new AppError("CUSTOM_ERR", "Something failed", 418, { foo: "bar" });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.name).toBe("AppError");
    expect(err.code).toBe("CUSTOM_ERR");
    expect(err.message).toBe("Something failed");
    expect(err.statusCode).toBe(418);
    expect(err.details).toEqual({ foo: "bar" });
    expect(err.isOperational).toBe(true);
    expect(err.stack).toBeDefined();
  });

  it("defaults AppError statusCode to 500 when not specified", () => {
    const err = new AppError("SERVER_FAULT", "Database timed out");
    expect(err.statusCode).toBe(500);
  });

  it("creates BadRequestError with status 400 and code BAD_REQUEST", () => {
    const err = new BadRequestError("Invalid parameter 'sort'");
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.message).toBe("Invalid parameter 'sort'");
  });

  it("creates UnauthorizedError with status 401 and code UNAUTHENTICATED", () => {
    const err = new UnauthorizedError("Session expired");
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHENTICATED");
    expect(err.message).toBe("Session expired");
  });

  it("creates ForbiddenError with status 403 and code FORBIDDEN", () => {
    const err = new ForbiddenError("Insufficient permissions");
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.message).toBe("Insufficient permissions");
  });

  it("creates NotFoundError with status 404 and code NOT_FOUND", () => {
    const err = new NotFoundError("Agent not found", { agentId: "123" });
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.details).toEqual({ agentId: "123" });
  });

  it("creates ConflictError with status 409 and code CONFLICT", () => {
    const err = new ConflictError("Connector name already exists");
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("creates ValidationError with status 422 and code VALIDATION_ERROR", () => {
    const issues = [{ field: "email", message: "Invalid email address" }];
    const err = new ValidationError("Validation failed", issues);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.details).toEqual(issues);
  });
});
