import { useMutation, useQuery } from "convex/react";  // every component starting with use is a custom hook in react
// useQuery - subscribes to data, stays live, auto-updates when database changes
// useMutation — triggers a change in the database


import { api } from "../../../../convex/_generated/api"; // api — the auto-generated menu of all your Convex functions

import { Id, Doc} from "../../../../convex/_generated/dataModel";


export const useProjects = () => {  // useProjects is a custom hook that allows us to read all projects from our database.
    return useQuery(api.projects.get);
};

export  const useProjectsPartial = (limit: number) => { // useProjectsPartial is a custom hook that allows us to read a limited number of projects.
    return useQuery(api.projects.getPartial, {
        limit,
    });
};

export const useCreateProject = () => {
    return useMutation(api.projects.create).withOptimisticUpdate(
        (localStore, args) => {
            const existingProjects = localStore.getQuery(api.projects.get);


            if(existingProjects !== undefined) {
                const now = Date.now();
                const newProject = {
                    _id: crypto.randomUUID() as Id<"projects">,
                    _creationTime: now,
                    name: args.name,
                    ownerId: "anonymous",
                    updatedAt: now,

                };

                localStore.setQuery(api.projects.get, {}, [
                    newProject,
                    ...existingProjects,
                ]);
            }
        }
    );
}