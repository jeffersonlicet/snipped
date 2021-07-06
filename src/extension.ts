import * as vscode from "vscode";
import * as path from "path";

import { SIGNALS } from "./types/signals";
import { PrevState } from "./types/prevState";

import { copyText } from "./text";
import { onEndSignal } from "./hooks";
import { generateInternalUri, read } from "./html";
import { placeholders } from "./constants/placeholders";
import { writeFile } from "fs";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "tweet-it.start",
    async () => {
      try {
        const prevState: PrevState = {};
        const { activeTextEditor: editor } = vscode.window;

        if (!editor) {
          return;
        }

        const contentPath = path.resolve(
          context.extensionPath,
          "resources",
          "index.html"
        );

        await copyText();

        const panel = vscode.window.createWebviewPanel(
          "snipped-tab",
          "Snipped",
          {
            viewColumn: vscode.ViewColumn.Beside,
            preserveFocus: false,
          },
          {
            enableScripts: true,
          }
        );

        panel.webview.onDidReceiveMessage(async ({ type, data }) => {
          if (type === SIGNALS.end) {
            onEndSignal(editor, prevState);
          }

          if (type === "copied") {
            vscode.window.showInformationMessage("Snipped copied");
          }

          if (type === "download") {
            const uri = await vscode.window.showSaveDialog({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              filters: { Images: ["png"] },
            });

            if (uri) {
              writeFile(uri.fsPath, Buffer.from(data, "base64"), (err) => {
                if (!err) {
                  vscode.window.showInformationMessage("Snipped saved");
                }
              });
            }
          }
        });

        prevState.clipboard = await vscode.env.clipboard.readText();
        prevState.selection = editor.selection;

        let html = await read(contentPath);

        const replacements = placeholders.map(({ key, value }) => ({
          key,
          value: panel.webview
            .asWebviewUri(generateInternalUri(context.extensionPath, value))
            .toString(),
        }));

        const data = {
          start: (editor.selection ? editor.selection.start.line : 0) + 1,
          end: editor.selection
            ? editor.selection.end.line
            : editor.document.lineCount,
          fileName: editor.document.fileName.split("/").pop(),
          lang: editor.document.languageId,
        };

        // I know
        replacements.push({
          key: "__DATA_PLACEHOLDER__",
          value: JSON.stringify(JSON.stringify(data)),
        });

        replacements.forEach(({ key, value }) => {
          html = html.replace(key, value);
        });

        panel.webview.html = html;
      } catch (e) {
        console.log(e);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
