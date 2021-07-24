import * as vscode from "vscode";
import { copySelection, selectAll } from "./commands";

export async function copyText() {
  const { activeTextEditor } = vscode.window;

  if (!activeTextEditor) {
    return;
  }

  const selection = activeTextEditor.selection;

  if (!selection || selection.isEmpty) {
    selectAll();
  }

  await copySelection();
}
