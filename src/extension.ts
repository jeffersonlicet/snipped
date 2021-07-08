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
    "snipped.start",
    async () => {
      let log = vscode.window.createOutputChannel("snipped");

      try {
        const prevState: PrevState = {};
        const { activeTextEditor: editor } = vscode.window;

        if (!editor) {
          return;
        }

        prevState.clipboard = await vscode.env.clipboard.readText();
        prevState.selection = editor.selection;

        await copyText();

        const contentPath = path.resolve(
          context.extensionPath,
          "resources",
          "index.html"
        );

        const panel = vscode.window.createWebviewPanel(
          "snipped-tab",
          "Snipped",
          {
            viewColumn: vscode.ViewColumn.Beside,
            preserveFocus: false,
          },
          {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(context.extensionPath)],
          }
        );

        panel.webview.onDidReceiveMessage(async ({ type, data }) => {
          if (type === SIGNALS.end) {
            onEndSignal(editor, prevState);
          }

          if (type === "copied") {
            vscode.window.showInformationMessage("Snipped copied");
          }

          if (type === "tweet") {
            const res = await vscode.window.showInformationMessage(
              "The snipped is copied in your clipboard. Click Compose Tweet and paste it on the Twitter Composer for sharing it as an image.",
              "Cancel",
              "Compose Tweet"
            );

            if (res === "Compose Tweet") {
              vscode.env.openExternal(
                vscode.Uri.parse(`https://twitter.com/intent/tweet`)
              );
            }
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

        html = html.replace(/__CSP_SOURCE__/g, panel.webview.cspSource);
        panel.webview.html = html;
      } catch (e) {
        log.append("Error when performing extension task");
        console.log(e);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
