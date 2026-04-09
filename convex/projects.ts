import { mutation, query } from "./_generated/server"; // mutation is function that allows us to change data in our database and query is function that allows us to read data from our database.
import { v } from "convex/values";
import { verifyAuth } from "./auth";  // verifyAuth checks if the user is authenticated (yes/no)

export const create = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {

        const identity = await verifyAuth(ctx);


        const projectId = await ctx.db.insert("projects", {
            name: args.name,
            ownerId: identity.subject,
            updatedAt: Date.now(),
        });

        return projectId;
    },
});

export const getPartial = query({  // getpartial is a query that allows us to read a limited number of projects from our database.
    args: {
        limit: v.number(),
    },
    handler: async ( ctx, args) => {
        const identity = await verifyAuth(ctx);

        return await ctx.db
        .query("projects")
        .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject)) // here q is query builder provided by convex with fn like .eq, .gt, .lt...
        .order("desc")  // here we we used .order("dsec") because if we go for updatedAt which will provide us larger number for latest projects and due to descending order it will not give latest projects.
        .take(args.limit);

    },
});

export const get = query({
    args: {},
    handler: async (ctx) => {
        const identity = await verifyAuth(ctx);

        return await ctx.db
          .query("projects")
          .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
          .order("desc")
          .collect();
    },
});