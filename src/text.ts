import { copySelection, selectAll } from "./commands";
import * as vscode from "vscode";

export async function copyText() {
  const activeTextEditor = vscode.window.activeTextEditor;

  if (!activeTextEditor) {
    console.log("no active text editor in copytext");
    return;
  }

  const selection = activeTextEditor.selection;

  if (!selection || selection.isEmpty) {
    console.log("No selection");
    selectAll();
  } else {
    console.log("there is a selection");
  }

  await copySelection();
}
