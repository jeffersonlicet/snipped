import { copySelection, selectAll } from "./commands";
import * as vscode from "vscode";

export async function copyText() {
  const activeTextEditor = vscode.window.activeTextEditor;

  if (!activeTextEditor) {
    return;
  }

  const selection = activeTextEditor.selection;

  if (!selection || selection.isEmpty) {
    selectAll();
  } else {
  }

  await copySelection();
}
