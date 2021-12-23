import { existsSync, statSync } from "fs";
import express, { RequestHandler } from "express";
import { expressLogger, imageLogger } from "./utils/logger";
import fileUpload from "express-fileupload";
import { join } from "path";
import rateLimit from "express-rate-limit";
import { unlink } from "fs/promises";

export default function(imageFolder: string) {
  if (!existsSync(imageFolder)) throw new Error("No image folder found");
  if (!process.env.TOKEN) throw new Error("No token specified in environment variables");

  const app = express();
  app.use(expressLogger);

  app.use(rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "60000"),
    max: parseInt(process.env.RATE_LIMIT_MAX || "30"),
  }));

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

  app.get("/*", (req, res) => {
    const path = req.path.slice(1) || process.env.HOMEPAGE_FILE;
    if (!path) return res.sendStatus(404);
    if (path.includes("..")) return res.sendStatus(403);

    const fullPath = join(imageFolder, path);
    if (testFile(fullPath)) return res.sendFile(fullPath);

    res.sendStatus(404);
  });

  app.post("/*", requireToken, fileUpload({ createParentPath: true, useTempFiles: process.env.USE_TEMP === "true" }), (req, res) => {
    if (!req.files?.file || Array.isArray(req.files.file)) return res.sendStatus(400);
    const { file } = req.files;

    const extension = file.name.split(".").pop() || "";
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
    }).catch(e => {
      imageLogger.error(`Unknown error when deleting image ${path}: ${JSON.stringify(e)}`);
      res.sendStatus(500);
    });
  });

  return app;
}

// request handler to require token in authorization header
const requireToken: RequestHandler = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token || token !== process.env.TOKEN) return res.sendStatus(401);
  next();
};

// generate random id for images
const length = parseInt(process.env.ID_LENGTH || "8");
const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function generateId(imageFolder: string): string {
  let id = "";
  for (let i = 0; i < length; i += 1) id += chars[Math.floor(Math.random() * chars.length)];
  if (testFile(join(imageFolder, id))) return generateId(imageFolder);
  return id;
}

// test if file exists and is a file
function testFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}
