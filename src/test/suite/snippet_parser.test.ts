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

const fakeSnippetItem1: sp.SnippetItem = {
    title: "super snippet",
    tags: [fakeTag1.uuid, fakeTag2.uuid],
    fragments: [
        {
            notes: "description 1",
            content: "some very interesting code",
            language: "PythonLexer",
        },
    ],
};

const fakeSnippetItem2: sp.SnippetItem = {
    title: "unused snippet",
    tags: [fakeTag1.uuid],
    fragments: [
        {
            notes: "description 2",
            content: "some unused code",
            language: "LuaLexer",
        },
    ],
};

const tagsMap = new Map<string, string>();
tagsMap.set(fakeTag1.uuid, fakeTag1.title);
tagsMap.set(fakeTag2.uuid, fakeTag2.title);

suite("Unit Snippets Parser", () => {
    test("Convert tags", () => {
        const fakeTags = [fakeTag1.uuid, fakeTag2.uuid];
        const file = sp.convertTags(fakeTags, tagsMap);

        assert.strictEqual(file, "(Tag1, Tag2)");
    });

    test("Convert tags with no tags", () => {
        assert.strictEqual(sp.convertTags([], tagsMap), "");
    });

    test("Extract tags", () => {
        const tags = sp.mapTags([fakeTag1, fakeTag2]);

        assert.strictEqual(tags.size, 2);
        assert.strictEqual(tags.get("FAKE-UUID-1"), "Tag1");
        assert.strictEqual(tags.get("FAKE-UUID-2"), "Tag2");
    });

    test("SnippetQuickItem builder", () => {
        const snippets = [fakeSnippetItem1, fakeSnippetItem2];
        const snippetItems = sp.snippetQuickItemBuilder(snippets, tagsMap);

        assert.strictEqual(snippetItems.length, 2);
        assert.strictEqual(snippetItems[0].label, "super snippet");
        assert.strictEqual(snippetItems[0].description, "(Tag1, Tag2)");
        assert.strictEqual(snippetItems[0].content, "some very interesting code");
        assert.strictEqual(snippetItems[0].detail, "description 1");

        assert.strictEqual(snippetItems[1].label, "unused snippet");
        assert.strictEqual(snippetItems[1].description, "(Tag1)");
        assert.strictEqual(snippetItems[1].content, "some unused code");
        assert.strictEqual(snippetItems[1].detail, "description 2");
        assert.strictEqual(snippetItems[1].language, "LuaLexer");
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
