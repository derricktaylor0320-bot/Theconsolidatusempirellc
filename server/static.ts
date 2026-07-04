import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve attached_assets at both /assets and /attached_assets paths for product images
  const attachedAssetsPath = path.resolve(__dirname, "..", "attached_assets");
  if (fs.existsSync(attachedAssetsPath)) {
    app.use("/assets", express.static(attachedAssetsPath));
    app.use("/attached_assets", express.static(attachedAssetsPath));
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
