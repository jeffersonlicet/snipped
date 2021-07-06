import * as vscode from "vscode";
import { PrevState } from "./types/prevState";

/**
 * onEndSignal Hook
 * @param editor
 * @param prevState
 */
export async function onEndSignal(
  editor: vscode.TextEditor,
  { selection, clipboard }: PrevState
) {
  if (clipboard) {
    await vscode.env.clipboard.writeText(clipboard);
  }

  if (selection) {
    editor.selection = selection;
  } else {
    var { end } = editor.selection;
    editor.selection = new vscode.Selection(end, end);
  }
}
