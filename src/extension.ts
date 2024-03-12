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

        const { enableLogo, footerText, enablePng, autoCopy, disableTitle, scale } =
          vscode.workspace.getConfiguration("snipped", null);

        panel.webview.onDidReceiveMessage(async ({ type, data, message }) => {
          if (type === SIGNALS.end) {
            onEndSignal(editor, prevState);
          }

          if (type === "beer") {
            vscode.window
              .showInformationMessage("Buy me a beer by sending some crypto to my BSC address", "Sure!", "No")
              .then(async answer => {
                if (answer === "Sure!") {
                  await vscode.env.clipboard.writeText("0x8340ACeF21D1fAE94305ad580B963b3f5283F1AC");
                  vscode.env.openExternal(
                    vscode.Uri.parse('https://bscscan.com/address/0x8340ACeF21D1fAE94305ad580B963b3f5283F1AC')
                  );
                }
              })
          }

          if (type === "message") {
            vscode.window.showInformationMessage(message);
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
              filters: { Images: [enablePng ? "png" : "svg"] },
            });

            if (uri) {
              writeFile(
                uri.fsPath,
                Buffer.from(data, enablePng ? "base64" : "utf-8"),
                (err) => {
                  if (!err) {
                    vscode.window.showInformationMessage("Snipped saved");
                  }
                }
              );
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
          fileName: disableTitle
            ? ""
            : editor.document.fileName.split(path.sep).pop(),
          lang: editor.document.languageId,
          enableLogo,
          footerText,
          enablePng,
          autoCopy,
          scale,
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

export function deactivate() { }
