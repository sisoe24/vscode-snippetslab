import * as fs from "fs";
import * as vscode from "vscode";
import { homedir } from "os";
import { getConfig } from "./config";

export type SnippetItem = {
    title: string;
    tags: string[];
    fragments: [
        {
            content: string;
            notes: string;
            language: string;
        }
    ];
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

class SnippetQuickItem implements vscode.QuickPickItem {
    label: string;
    content: string;
    language?: string | undefined;
    detail?: string | undefined;
    description?: string | undefined;

    constructor(
        label: string,
        content: string,
        description: string | undefined,
        detail?: string | undefined,
        language?: string | undefined
    ) {
        this.label = label;
        this.content = content;
        this.description = description;
        this.detail = detail;
        this.language = language;
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
    console.log(backupPath);

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
 * @param {Library} tags The content of the SnippetsLab library.
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
        return tagsMap.get(tag);
    });

    return `(${tagTitles.join(", ")})`;
}

/**
 * SnippetQuickItem builder.
 *
 * Note: we ignore the snippets with the tag "vscode-ignore".
 *
 * TODO: Allow multiple fragments.
 *
 * @param {SnippetItem[]} snippets An array of SnippetItem.
 * @param {Map<string, string>} tagsMap The mapped tags (UUID -> Tag name).
 * @returns {SnippetQuickItem[]} An array of SnippetQuickItem ready to be used in the QuickPick.
 */
export function snippetQuickItemBuilder(
    snippets: SnippetItem[],
    tagsMap: Map<string, string>
): SnippetQuickItem[] {
    const snippetQuickItems: SnippetQuickItem[] = [];

    for (const snippet of snippets) {
        const tags = convertTags(snippet["tags"], tagsMap);

        if (tags.search("vscode-ignore") !== -1) {
            continue;
        }

        snippetQuickItems.push(
            new SnippetQuickItem(
                snippet["title"],
                snippet["fragments"][0]["content"],
                tags,
                snippet["fragments"][0]["notes"],
                snippet["fragments"][0]["language"]
            )
        );
    }
    return snippetQuickItems;
}

/**
 * Main entry point for the parser.
 *
 * @returns {SnippetQuickItem[]} An array of SnippetQuickItem ready to be used in the QuickPick.
 */
export function parseSnippets(): SnippetQuickItem[] {
    const lib = getLibrary(getConfig("backupFolder"));
    if (!lib) {
        throw Error("No library found");
    }
    return snippetQuickItemBuilder(lib["contents"]["snippets"], mapTags(lib["contents"]["tags"]));
}
