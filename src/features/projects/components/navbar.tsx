import { Poppins } from "next/font/google";
import React, { useState } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { CloudCheckIcon, LoaderIcon } from "lucide-react";


import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { useProject, useRenameProject } from "../hooks/use-project";

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

const font = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
})

export const Navbar = ({ projectId }: {
    projectId: Id<"projects">;
}) => {

    const project = useProject(projectId);
    const renameProject = useRenameProject(projectId);


    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setnewName] = useState("");

    const handleStartRename = () => {
        if (!project) return;
        setnewName(project.name);
        setIsRenaming(true);
    };

    const handleSubmit = () => {

        if (!project) return;
        setIsRenaming(false);

        const trimmedName = newName.trim();
        if (!trimmedName || trimmedName === project.name) return;

        renameProject({ id: projectId, newName: trimmedName });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit();

        } else if (e.key === "Escape") {
            setIsRenaming(false);
        }
    };


    return (
        <nav className=" flex justify-between items-center gap-x-2 p-2 bg-sidebar border-b">
            <div className="flex items-center gap-x-2">
                <Breadcrumb>
                    <BreadcrumbList className="gap=0!">
                        <BreadcrumbItem>
                            <BreadcrumbLink
                                className="flex items-center gap-1.5"
                                asChild
                            >
                                <Button
                                    variant="ghost"
                                    className="w-fit! p-1.5! h-7!"
                                    asChild
                                >

                                    <Link href="/">
                                        <Image
                                            src="/logo.svg"
                                            alt="logo"
                                            width={28}
                                            height={28}
                                        />
                                        <span
                                            className={cn("text-sm font-medium",
                                                font.className,

                                            )}
                                        >
                                            Intent
                                        </span>
                                    </Link>

                                </Button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="ml-0! mr-1" />
                        <BreadcrumbItem>
                            {isRenaming ? (
                                <input
                                    autoFocus
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setnewName(e.target.value)}
                                    onFocus={(e) => e.currentTarget.select()}
                                    onBlur={handleSubmit}
                                    onKeyDown={handleKeyDown}
                                    className="text-sm bg-transparent text-foreground outline-none focus:ring-1 focus:ring-inset focus:ring-ring font-medium max-w-40 truncate"
                                />
                            ) : (
                                <BreadcrumbPage
                                    onClick={handleStartRename}
                                    className="text-sm cursor-pointer hover:text-primary font-medium max-w-40 truncate">
                                    {project?.name ?? "Loading..."}
                                </BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                {project?.importStatus === "importing" ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <LoaderIcon className="size-4 text-muted-foreground animate-spin" />
                        </TooltipTrigger>
                        <TooltipContent>Importing....</TooltipContent>
                    </Tooltip>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <CloudCheckIcon className="size-4 text-muted-foreground " />
                        </TooltipTrigger>
                        <TooltipContent>
                            Saved{" "}
                            {project?.updatedAt ? formatDistanceToNow(
                                project.updatedAt,
                                { addSuffix: true }
                            ) : "Loading..."}
                        </TooltipContent>
                    </Tooltip>

                )
                }
            </div>
            <div className="flex items-center gap-2">
                <UserButton />
            </div>
        </nav>
    )
}