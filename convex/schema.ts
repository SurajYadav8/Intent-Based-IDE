import { defineSchema, defineTable} from "convex/server";
import { v } from "convex/values";

export default defineSchema ({
    projects: defineTable({
        name: v.string(),
        ownerId: v.string(),
        updatedAt: v.number(),
        
        importStatus: v.optional(
            v.union( // here v.union gives us option to have one of the following
                v.literal("importing"), // literal is used to specify that the value must be exactly this.
                v.literal("completed"),
                v.literal("failed"),
            ),
        ),
        exportStatus: v.optional(
            v.union(
                v.literal("exporting"),
                v.literal("completed"),
                v.literal("failed"),
                v.literal("cancelled"),
            ),
        ),
        exportRepoUrl: v.optional(v.string()),
          
    }).index("by_owner", ["ownerId"]),
});