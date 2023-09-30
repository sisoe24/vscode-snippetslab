import * as vscode from "vscode";
import { getConfig } from "./config";
import { parseSnippets } from "./snippet_parser";

export function activate(context: vscode.ExtensionContext) {
    const snippets = parseSnippets();

    let disposable = vscode.commands.registerCommand("snippetslab.showSnippets", () => {
        if (!snippets) {
            return;
        }

        vscode.window
            .showQuickPick(snippets, {
                matchOnDescription: getConfig("searchSnippetsByNotes"),
                matchOnDetail: getConfig("searchSnippetsByTags"),
            })
            .then((item) => {
                if (!item) {
                    return;
                }

                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    return;
                }

                if (getConfig("copySnippetToClipboard")) {
                    vscode.env.clipboard.writeText(item.content);
                }

                editor.insertSnippet(new vscode.SnippetString(item.content), editor.selection);
            });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
