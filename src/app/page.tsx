"use client";

import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";

const X = () => {
  const tasks = useQuery(api.tasks.get)
  return (
    <div className="flex flex-col gap-2 p-4">
      {tasks?.map((task) => (
        <div className="border rounded p-2 flex flex-col" key={task.id}>
          <p> {task.text}</p>
          <p> Is completed: {`${task.isCompleted}`}</p>
        </div>
      ))}
    </div>

  );
}
export default X;