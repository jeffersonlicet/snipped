import * as vscode from "vscode";

export type PrevState = {
  selection?: vscode.Selection | undefined;
  clipboard?: string | undefined;
};
