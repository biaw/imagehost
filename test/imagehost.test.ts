import initApp from "../src/app";
import { join } from "path";
import request from "supertest";

const images = join(__dirname, "imagehost-test-images");

Object.assign(process.env, {
  TOKEN: "test",
  HOMEPAGE_FILE: "homepage.txt",
}, process.env);

const app = request(initApp(images));

describe("GET /", () => {
  it("should return homepage", async () => {
    const { text } = await app.get("/");
    expect(text).toBe("hello homepage");
  });
});

describe("GET /test.txt", () => {
  it("should return test.txt", async () => {
    const { text } = await app.get("/test.txt");
    expect(text).toBe("hello test.txt");
  });
});

describe("GET /invalid.txt", () => {
  it("should return 404", async () => {
    const { status } = await app.get("/invalid.txt");
    expect(status).toBe(404);
  });
});

describe("GET /../example.env", () => {
  it("should return 403", async () => {
    const { status } = await app.get("/../.env");
    expect(status).toBe(403);
  });
});

describe("POST /test.png", () => {
  it("should fail without token", () => app.post("/test.png").expect(401));
  it("should succeed with token", () => app.post("/test.png").set("authorization", "test").attach("file", join(__dirname, "test.png")).expect(200));
});

describe("DELETE /test.png", () => {
  it("should fail without token", () => app.delete("/test.png").expect(401));
  it("should succeed with token", () => app.delete("/test.png").set("authorization", "test").expect(200));
});

describe("POST and DELETE /", () => {
  it("should create random file id and succeed", async () => {
    const { body: { file }} = await app.post("/").set("authorization", "test").attach("file", join(__dirname, "test.txt"));
    expect(file).toMatch(/^[a-zA-Z0-9]{8}\.txt$/);

    const { text } = await app.get(`/${file}`);
    expect(text).toBe("hello world");

    await app.delete(`/${file}`).set("authorization", "test");
  });
});
