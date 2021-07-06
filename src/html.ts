import { PathLike, readFile } from "fs";
import * as path from "path";
import * as vscode from "vscode";

export function generateInternalUri(extensionPath: string, value: string) {
  return vscode.Uri.file(path.join(extensionPath, "resources", value));
}

export function read(path: PathLike): Promise<string> {
  return new Promise((resolve, reject) =>
    readFile(path, "utf-8", (err, data) => {
      if (err) {
        return reject(err);
      }

      resolve(data);
    })
  );
}
