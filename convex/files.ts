import { mutation, query } from "./_generated/server";
import { convexToJson, v } from "convex/values";
import { verifyAuth } from "./auth";

export const get = query({
    args: {projectId: v.id("projects")},
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const project = await ctx.db.get("projects", args.projectId);

        return await ctx.db
          .query("projects")
          .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
          .order("desc")
          .collect();
    },
});