import { describe, it, expect, vi } from "vitest";
import { asyncHandler } from "./asyncHandler";
import { Request, Response, NextFunction } from "express";

describe("asyncHandler Wrapper", () => {
  it("executes the async handler and does not call next with error when resolved", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(fn);
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    wrapped(req, res, next);
    // Allow promise tick to complete
    await new Promise((r) => setTimeout(r, 10));

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("catches rejected Promise and forwards error to next()", async () => {
    const error = new Error("Async failure");
    const fn = vi.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(fn);
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    wrapped(req, res, next);
    await new Promise((r) => setTimeout(r, 10));

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });

  it("catches errors thrown inside async handlers and forwards them to next()", async () => {
    const error = new Error("Handler error");
    const fn = vi.fn().mockImplementation(async () => {
      throw error;
    });
    const wrapped = asyncHandler(fn);
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    wrapped(req, res, next);
    await new Promise((r) => setTimeout(r, 10));

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });
});
