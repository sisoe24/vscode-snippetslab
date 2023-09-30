import * as vscode from "vscode";

type BooleanConfigProperties =
    | "searchSnippetsByNotes"
    | "searchSnippetsByTags"
    | "filterByLanguage"
    | "showSnippets"
    | "copySnippetToClipboard";
type StringConfigProperties = "backupFolder";
type ConfigProperties = BooleanConfigProperties | StringConfigProperties;

/**
 * Get a configuration property.
 *
 * This is a wrapper around vscode.workspace.getConfiguration to avoid having some
 * boilerplate code. It calls the root configuration and then get the property.
 *
 * @param property - name of the configuration property to get.
 * @returns - the value of the property.
 * @throws Error if the property doesn't exist.
 */
export function getConfig(property: BooleanConfigProperties): boolean;
export function getConfig(property: StringConfigProperties): string;
export function getConfig(property: ConfigProperties): unknown {
    const config = vscode.workspace.getConfiguration("snippetsLab");
    const subConfig = config.get(property);

    if (typeof subConfig === "undefined") {
        throw new Error(`Configuration: ${property} doesn't exist`);
    }

    return subConfig;
}
