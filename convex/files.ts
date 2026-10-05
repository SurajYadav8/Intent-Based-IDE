import { mutation, query } from "./_generated/server";
import { convexToJson, v } from "convex/values";
import { verifyAuth } from "./auth";
import { Doc, Id } from "./_generated/dataModel";

export const getFiles = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const project = await ctx.db.get("projects", args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized access to this project");
        }

        return await ctx.db
            .query("files")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();
    },
});

export const getFile = query({
    args: { id: v.id("files") },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const file = await ctx.db.get("files", args.id);

        if (!file) {
            throw new Error("File not found");
        }

        const project = await ctx.db.get("projects", file.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized access to this project");
        }

        return file;
    },
});

/**
 * this function is used to get the full path to a file by traversing up the parent chain
 * Input: A file ID (e.g., the ID of "button.tsx")
 * Output: An array of ancestors from the root to file: [{_id, name: "src"}, {_id, name: "components"}, {_id, name: "button.tsx"}]
 * Used for: breadcrumbs navigation (src > components > file-explorer > tree.tsx)
 */

export const getFilePath = query({  // this is not the most efficient way to do this, but it works for now....
    args: { id: v.id("files") },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const file = await ctx.db.get("files", args.id);

        if (!file) {
            throw new Error("File not found");
        }

        const project = await ctx.db.get("projects", file.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized access to this project");
        }

        const path: { _id: string; name: string }[] = [];
        let currentId: Id<"files"> | undefined = args.id;

        while (currentId) {
            const file = (await ctx.db.get("files", currentId)) as
                | Doc<"files">
                | undefined;

            if (!file) break;

            path.unshift({ _id: file._id, name: file.name });
            currentId = file.parentId;

        }

        return path;
    },


});

export const getFolderContents = query({
    args: {
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);
        const project = await ctx.db.get("projects", args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized access to this project");
        }

        const files = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) =>
                q
                    .eq("projectId", args.projectId)
                    .eq("parentId", args.parentId)
            )
            .collect();

        //Sort: Folder first -> then files -> alphabetically within each group

        return files.sort((a, b) => {

            if (a.type === "folder" && b.type === "file") return -1;
            if (b.type === "file" && a.type === "folder") return 1;

            return a.name.localeCompare(b.name);
        });

    },
});

export const createFile = mutation({
    args: {
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        name: v.string(),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const project = await ctx.db.get("projects", args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized to access this project");
        }

        const files = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) =>
                q
                    .eq("projectId", args.projectId)
                    .eq("parentId", args.parentId)
            )

            .collect();

        const existing = files.find(
            (file) => file.name === args.name && file.type === "file"
        );

        const now = Date.now();

        if (existing) throw new Error("A file with this name already exists");

        await ctx.db.insert("files", {
            projectId: args.projectId,
            name: args.name,
            content: args.content,
            type: "file",
            parentId: args.parentId,
            updatedAt: now,
        })

        await ctx.db.patch("projects", args.projectId, {
            updatedAt: now,
        });
    },
});

export const createFolder = mutation({
    args: {
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const project = await ctx.db.get("projects", args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized to access this project");
        }

        const files = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) =>
                q
                    .eq("projectId", args.projectId)
                    .eq("parentId", args.parentId)
            )

            .collect();

        const existing = files.find(
            (file) => file.name === args.name && file.type === "folder"
        );

        const now = Date.now();

        if (existing) throw new Error("A folder with this name already exists");

        await ctx.db.insert("files", {
            projectId: args.projectId,
            name: args.name,
            type: "folder",
            parentId: args.parentId,
            updatedAt: now,
        });

        await ctx.db.patch("projects", args.projectId, {
            updatedAt: now,
        })
    },
});


export const renameFile = mutation({
    args: {
        id: v.id("files"),
        newName: v.string(),
    },
    handler: async (ctx, args) => {

        const identity = await verifyAuth(ctx);

        const file = await ctx.db.get("files", args.id);

        if (!file) throw new Error("File not found");

        const project = await ctx.db.get("projects", file.projectId);

        if (!project) throw new Error("Project not found");

        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized access to this project");
        }


        // check if a file with new name is already exist in the same parent folder
        const siblings = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) =>
                q
                    .eq("projectId", file.projectId)
                    .eq("parentId", file.parentId)
            )
            .collect();

        const existing = siblings.find(
            (sibling) =>
                sibling.name === args.newName &&
                sibling.type === file.type &&
                sibling._id !== args.id
        );

        if (existing) {
            throw new Error(`A ${file.type} with this name already exists in this location`);
        }

        const now = Date.now();

        // Update the file name 

        await ctx.db.patch("files", args.id, {
            name: args.newName,
            updatedAt: now,
        });

        await ctx.db.patch("projects", file.projectId, {
            updatedAt: now,
        })
    },
});

export const deleteFile = mutation({
    args: {
        id: v.id("files"),
    },
    handler: async (ctx, args) => {

        const identity = await verifyAuth(ctx);

        const file = await ctx.db.get("files", args.id);

        if (!file) throw new Error("File not found");

        const project = await ctx.db.get("projects", file.projectId);

        if (!project) throw new Error("Project not found");

        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized access to this project");
        }


        // Recursively delete files/folder and all descendants 

        const deleteRecursive = async (fileId: Id<"files">) => {
            const item = await ctx.db.get("files", fileId);

            if (!item) {
                return;
            }

            // If it's a folder, delete all children first

            if (item.type === "folder") {
                const children = await ctx.db
                    .query("files")
                    .withIndex("by_project_parent", (q) =>
                        q
                            .eq("projectId", item.projectId)
                            .eq("parentId", fileId)
                    )
                    .collect();

                for (const child of children) {
                    await deleteRecursive(child._id);
                }
            }

            // Delete storage file if it exists
            if (item.storageId) {
                await ctx.storage.delete(item.storageId);
            }

            // Delete the file/folder itself
            await ctx.db.delete("files", fileId);
        };

        await deleteRecursive(args.id);

        const now = Date.now();
        await ctx.db.patch("projects", file.projectId, {
            updatedAt: now,
        })
    },
});

export const updateFileContent = mutation({
    args: {
        id: v.id("files"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const file = await ctx.db.get("files", args.id);

        if (!file) throw new Error("File not found");

        const project = await ctx.db.get("projects", file.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized access to this project");
        }

        const now = Date.now();

        await ctx.db.patch("files", args.id, {
            content: args.content,
            updatedAt: now,
        });

        await ctx.db.patch("projects", file.projectId, {
            updatedAt: now,
        });
    }
})