import * as vscode from "vscode";

function command(command: string) {
  return vscode.commands.executeCommand(command);
}

export function selectAll() {
  const { activeTextEditor } = vscode.window;

  // TODO: show alert for no active editor
  if (!activeTextEditor) {
    return;
  }

  const { lineCount } = activeTextEditor.document;

  const firstLine = activeTextEditor.document.lineAt(0);
  const lastLine = activeTextEditor.document.lineAt(lineCount - 1);

  activeTextEditor.selection = new vscode.Selection(
    firstLine.lineNumber,
    firstLine.range.start.character,
    lastLine.lineNumber,
    lastLine.range.end.character
  );
}

export function copySelection() {
  return command("editor.action.clipboardCopyWithSyntaxHighlightingAction");
}
