import * as assert from "assert";
import * as sp from "../../snippet_parser";
import * as fs from "fs";
import path = require("path");

const fakeTag1: sp.TagItem = {
    uuid: "FAKE-UUID-1",
    title: "Tag1",
};

const fakeTag2: sp.TagItem = {
    uuid: "FAKE-UUID-2",
    title: "Tag2",
};

const ignoreTag: sp.TagItem = {
    uuid: "FAKE-UUID-3",
    title: "vscode-ignore",
};

const fakeSnippetItem1: sp.SnippetItem = {
    title: "special snippet",
    tags: [fakeTag1.uuid, fakeTag2.uuid],
    fragments: [
        {
            title: "Fragment 1",
            note: "Fragment 1 Desc",
            content: "Framgent 1 code",
            language: "PythonLexer",
        },
        {
            title: "Fragment 2",
            note: "Fragment 2 Desc",
            content: "Fragment 2 code",
            language: "GoLexer",
        },
    ],
};

const fakeSnippetItem2: sp.SnippetItem = {
    title: "lua snippet",
    tags: [],
    fragments: [
        {
            title: "Fragment",
            note: "",
            content: "print('${1:msg}')",
            language: "LuaLexer",
        },
    ],
};

const fakeSnippetItem3: sp.SnippetItem = {
    title: "markdown snippet",
    tags: [ignoreTag.uuid],
    fragments: [
        {
            title: "Notes",
            note: "Some notes",
            content: "abc",
            language: "MarkdownLexer",
        },
    ],
};

const tagsMap = new Map<string, string>();
tagsMap.set(fakeTag1.uuid, fakeTag1.title);
tagsMap.set(fakeTag2.uuid, fakeTag2.title);
tagsMap.set(ignoreTag.uuid, ignoreTag.title);

suite("Unit Snippets Parser", () => {
    test("Convert tags", () => {
        const fakeTags = [fakeTag1.uuid, fakeTag2.uuid];
        const file = sp.convertTags(fakeTags, tagsMap);

        assert.strictEqual(file, "#Tag1, #Tag2");
    });

    test("Extract tags", () => {
        const tags = sp.mapTags([fakeTag1, fakeTag2]);

        assert.strictEqual(tags.size, 2);
        assert.strictEqual(tags.get("FAKE-UUID-1"), "Tag1");
        assert.strictEqual(tags.get("FAKE-UUID-2"), "Tag2");
    });

    test("Convert tags with no tags", () => {
        assert.strictEqual(sp.convertTags([], tagsMap), "");
    });

    test("SnippetQuickItem builder", () => {
        const snippets = [fakeSnippetItem1, fakeSnippetItem2, fakeSnippetItem3];
        const snippetItems = sp.snippetQuickItemBuilder(snippets, tagsMap);

        assert.strictEqual(snippetItems.size, 3);
        assert.strictEqual(snippetItems.get("python")?.length, 1);
        assert.strictEqual(snippetItems.get("go")?.length, 1);
        assert.strictEqual(snippetItems.get("lua")?.length, 1);

        const pythonSnippet = snippetItems.get("python")?.[0];
        assert.strictEqual(pythonSnippet?.label, "special snippet");
        assert.strictEqual(pythonSnippet?.description, "#Tag1, #Tag2 - Fragment 1");
        assert.strictEqual(pythonSnippet?.detail, "Fragment 1 Desc");
        assert.strictEqual(pythonSnippet?.content, "Framgent 1 code");

        const goSnippet = snippetItems.get("go")?.[0];
        assert.strictEqual(goSnippet?.label, "special snippet");
        assert.strictEqual(goSnippet?.description, "#Tag1, #Tag2 - Fragment 2");
        assert.strictEqual(goSnippet?.detail, "Fragment 2 Desc");
        assert.strictEqual(goSnippet?.content, "Fragment 2 code");

        const luaSnippet = snippetItems.get("lua")?.[0];
        assert.strictEqual(luaSnippet?.label, "lua snippet");
        assert.strictEqual(luaSnippet?.description, "");
        assert.strictEqual(luaSnippet?.detail, "");
        assert.strictEqual(luaSnippet?.content, "print('${1:msg}')");

    });
});

suite("Content library", () => {
    const testDataDir = path.join(__dirname, "..", "..", "test_data");
    fs.mkdirSync(testDataDir);

    setup(() => {
        for (let i = 0; i < 10; i++) {
            const path = `${testDataDir}/test${i}.snippetslab-backup`;
            fs.mkdirSync(path);
            fs.writeFileSync(`${path}/library.json`, JSON.stringify([i]));
        }
    });

    teardown(() => {
        fs.rmSync(`${testDataDir}`, { recursive: true });
    });

    test("Get library", () => {
        const library = sp.getLibrary(testDataDir);
        assert.deepEqual(library, [9]);
    });
});
