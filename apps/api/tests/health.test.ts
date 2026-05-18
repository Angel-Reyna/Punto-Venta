import request from "supertest";

jest.mock("../src/config/prisma", () => ({
  prisma: {}
}));

import { app } from "../src/app";

describe("health", () => {
  it("returns status and request id", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.requestId).toEqual(expect.any(String));
    expect(response.headers["x-request-id"]).toBe(response.body.requestId);
  });
});
