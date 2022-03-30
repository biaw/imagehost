import { existsSync, statSync } from "fs";
import { expressLogger, imageLogger } from "./utils/logger";
import type { RequestHandler } from "express";
import express from "express";
import fileUpload from "express-fileupload";
import { join } from "path";
import rateLimit from "express-rate-limit";
import { unlink } from "fs/promises";

// request handler to require token in authorization header
const requireToken: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || token !== process.env.TOKEN) return res.sendStatus(401);
  next();
};

// eslint-disable-next-line max-lines-per-function
export default function (imageFolder: string): express.Express {
  if (!existsSync(imageFolder)) throw new Error("No image folder found");
  if (!process.env.TOKEN) throw new Error("No token specified in environment variables");

  const app = express();
  app.use(expressLogger);

  app.use(rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW ?? "60000"),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? "30"),
  }));

  /* eslint-disable @typescript-eslint/naming-convention */
  app.get("/upload.sxcu", (req, res) => res.send({
    DestinationType: ["ImageUploader", "TextUploader", "FileUploader"].join(", "),
    RequestMethod: "POST",
    RequestURL: `http://${req.hostname}`,
    Headers: {
      Authorization: "TOKEN HERE",
    },
    Body: "MultipartFormData",
    FileFormName: "file",
    URL: `http://${req.hostname}/$json:file$`,
  }));
  /* eslint-enable @typescript-eslint/naming-convention */

  app.get("/*", (req, res) => {
    const path = req.path.slice(1) || process.env.HOMEPAGE_FILE;
    if (path) {
      if (path.includes("..")) {
        if (process.env.FORBIDDEN_FILE) {
          const forbiddenPath = join(imageFolder, process.env.FORBIDDEN_FILE);
          if (testFile(forbiddenPath)) return res.status(403).sendFile(forbiddenPath);
        }
        return res.sendStatus(403);
      }

      const fullPath = join(imageFolder, path);
      if (testFile(fullPath)) return res.sendFile(fullPath);
    }

    if (process.env.NOT_FOUND_FILE) {
      const notFoundPath = join(imageFolder, process.env.NOT_FOUND_FILE);
      if (testFile(notFoundPath)) return res.status(404).sendFile(notFoundPath);
    }

    res.sendStatus(404);
  });

  app.post("/*", requireToken, fileUpload({ createParentPath: true, useTempFiles: process.env.USE_TEMP === "true" }), (req, res) => {
    if (!req.files?.file || Array.isArray(req.files.file)) return res.sendStatus(400);
    const { file } = req.files;

    const extension = file.name.split(".").pop() ?? "";
    const path = req.path.slice(1) || generateId(imageFolder) + (extension ? `.${extension}` : "");
    file.mv(join(imageFolder, path), err => {
      if (err) {
        imageLogger.error(`Unknown error when moving uploaded image to ${path}: ${JSON.stringify(err)}`);
        return res.sendStatus(500);
      }

      imageLogger.info(`Image ${path} uploaded`);
      res.send({ file: path });
    });
  });

  app.delete("/*", requireToken, (req, res) => {
    const path = req.path.slice(1);
    if (!path) return res.sendStatus(404);

    const fullPath = join(imageFolder, path);
    if (!testFile(fullPath)) return res.sendStatus(404);

    unlink(fullPath).then(() => {
      imageLogger.info(`Image ${path} deleted`);
      res.sendStatus(200);
    })
      .catch(err => {
        imageLogger.error(`Unknown error when deleting image ${path}: ${JSON.stringify(err)}`);
        res.sendStatus(500);
      });
  });

  return app;
}

// generate random id for images
const length = parseInt(process.env.ID_LENGTH ?? "8");
const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function generateId(imageFolder: string): string {
  const id = Array(length).fill(true)
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
  if (testFile(join(imageFolder, id))) return generateId(imageFolder);
  return id;
}

// test if file exists and is a file
function testFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}
