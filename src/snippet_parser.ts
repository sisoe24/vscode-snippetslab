import * as fs from "fs";
import * as vscode from "vscode";
import { homedir } from "os";
import { getConfig } from "./config";

export type SnippetFragment = {
    content: string;
    note: string;
    language: string;
    title: string;
};

export type SnippetItem = {
    title: string;
    tags: string[];
    fragments: SnippetFragment[];
};

export type TagItem = {
    title: string;
    uuid: string;
};

type Library = {
    contents: {
        snippets: SnippetItem[];
        tags: TagItem[];
    };
};

export class SnippetQuickItem implements vscode.QuickPickItem {
    label: string;
    content: string;
    detail?: string | undefined;
    description?: string | undefined;

    constructor(
        label: string,
        content: string,
        detail?: string | undefined,
        description?: string | undefined
    ) {
        this.label = label;
        this.content = content;
        this.detail = detail;
        this.description = description;
    }
}

/**
 * Get the content of the latest SnippetsLab backup file.
 *
 * @returns {Library}  The content of the latest SnippetsLab backup file.
 * @throws {Error} If no library.json file is found.
 *
 */
export function getLibrary(path: string): Library {
    const backupPath = path.replace("~", homedir());

    let lastDir = "";
    let lastMod = 0;

    for (const file of fs.readdirSync(backupPath)) {
        if (
            file.endsWith("snippetslab-backup") &&
            fs.statSync(`${backupPath}/${file}`).mtimeMs > lastMod
        ) {
            lastMod = fs.statSync(`${backupPath}/${file}`).mtimeMs;
            lastDir = `${backupPath}/${file}`;
        }
    }

    const libraryPath = `${lastDir}/library.json`;
    if (!fs.existsSync(libraryPath)) {
        throw Error("No library.json found: " + libraryPath);
    }

    return JSON.parse(fs.readFileSync(libraryPath, "utf-8"));
}

/**
 * Extract the tags from the library and map them to the tag UUID.
 *
 * @param {TagItem[]} tags The content of the SnippetsLab library.
 * @returns {Map<string, string>} The tags from the SnippetsLab library.
 */
export function mapTags(tags: TagItem[]): Map<string, string> {
    const tagMap = new Map();

    // const tags = tags["contents"]["tags"];
    tags.forEach((tag) => {
        tagMap.set(tag["uuid"], tag["title"]);
    });

    return tagMap;
}

/**
 * Map the tags to the SnippetQuickItem.
 *
 * Convert the UUIDs to the tag names.
 *
 * @param {string[]} snippetTags The snippet tags (e.g. ["FAKE-UUID-1", "FAKE-UUID-2"]).
 * @returns {string} The concatenated tags (e.g. "(Tag1, Tag2)"
 */
export function convertTags(snippetTags: string[], tagsMap: Map<string, string>): string {
    if (!snippetTags || snippetTags.length === 0) {
        return "";
    }
    const tagTitles = snippetTags.map((tag) => {
        return `#${tagsMap.get(tag)}`;
    });

    return tagTitles.join(", ");
}

/**
 * SnippetQuickItem builder.
 *
 * Note: we ignore the snippets with the tag "vscode-ignore".
 *
 * TODO: Allow multiple fragments.
 *
 * @param {Map<string, SnippetItem[]>} snippets array of SnippetItem.
 * @param {Map<string, string>} tagsMap The mapped tags (UUID -> Tag name).
 * @returns {SnippetQuickItem[]} An array of SnippetQuickItem ready to be used in the QuickPick.
 */
export function snippetQuickItemBuilder(
    snippets: SnippetItem[],
    tagsMap: Map<string, string>
): Map<string, SnippetQuickItem[]> {
    const snippetQuickItems: Map<string, SnippetQuickItem[]> = new Map();

    for (const snippet of snippets) {
        const tags = convertTags(snippet["tags"], tagsMap);

        if (tags.search("vscode-ignore") !== -1) {
            continue;
        }

        for (const fragment of snippet["fragments"]) {

            let description = `${tags} - ${fragment["title"]}`.trimStart();
            if (description === "- Fragment") {
                description = "";
            }

            const snippetQuickItem = new SnippetQuickItem(
                snippet["title"],
                fragment["content"],
                fragment["note"],
                description
            );

            const language = fragment["language"].toLowerCase().replace("lexer", "");

            if (snippetQuickItems.has(language)) {
                snippetQuickItems.get(language)?.push(snippetQuickItem);
            } else {
                snippetQuickItems.set(language, [snippetQuickItem]);
            }
        }
    }

    return snippetQuickItems;
}

/**
 * Main entry point for the parser.
 *
 * @returns {Map<string, SnippetQuickItem[]>} An array of SnippetQuickItem ready to be used in the QuickPick.
 */
export function parseSnippets(): Map<string, SnippetQuickItem[]> {
    const lib = getLibrary(getConfig("backupFolder"));
    if (!lib) {
        throw Error("No library found");
    }
    return snippetQuickItemBuilder(lib["contents"]["snippets"], mapTags(lib["contents"]["tags"]));
}
