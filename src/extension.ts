import * as vscode from "vscode";
import { getConfig } from "./config";
import { parseSnippets, SnippetQuickItem } from "./snippet_parser";

function showQuickPick(snippets: SnippetQuickItem[], mode: string = "all") {
    vscode.window
        .showQuickPick(snippets, {
            title: `SnippetsLab: ${mode} snippets`,
            matchOnDescription: getConfig("searchSnippetsByDescription"),
            matchOnDetail: getConfig("searchSnippetsByDetails"),
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
}

export function activate(context: vscode.ExtensionContext) {
    
    let snippetsMap: Map<string, SnippetQuickItem[]>; 

    try {
        snippetsMap = parseSnippets();
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }

    const allSnippets = [...snippetsMap.values()].flat();

    context.subscriptions.push(
        vscode.commands.registerCommand("snippetslab.showAllSnippets", () => {
            showQuickPick(allSnippets);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("snippetslab.showLanguageSnippets", () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const languageSnippets = snippetsMap.get(editor.document.languageId);
            if (!languageSnippets) {
                return;
            }

            showQuickPick(languageSnippets, editor.document.languageId);
        })
    );
}

export function deactivate() {}
