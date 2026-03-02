"use client";

import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

const X = () => {
  const projects = useQuery(api.project.get);
  const createProject = useMutation(api.project.create);

  return (
    <div className="flex flex-col gap-2 p-4">
      <Button onClick={() => createProject({
        name: "New Project"
      })}>
        Add new 
      </Button>
      
      {projects?.map((project) => (
        <div className="border rounded p-2 flex flex-col" key={project._id}>
          <p> {project.name}</p>
          <p> Owner Id: {project.ownerId}</p>
        </div>
      ))}
    </div>

  );
}
export default X;