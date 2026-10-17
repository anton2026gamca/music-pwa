"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils"

interface ThreeDotMenuProps {
  groups: Array<{
    label?: string;
    fields: Array<{
      label: string;
      onClick: () => void;
      disabled?: boolean;
    }>
  }>;
  className?: string;
}

export function ThreeDotMenu({ groups, className }: ThreeDotMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" className={cn("size-10 rounded-xl", className)}>
          <MoreVertical className="size-5" />
        </Button>
      } />
      <DropdownMenuContent className="w-40" align="start">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex !== 0 && (
              <DropdownMenuSeparator />
            )}
            <DropdownMenuGroup key={groupIndex}>
              {group.label && <DropdownMenuLabel>{group.label}</DropdownMenuLabel>}
              {group.fields.map((field, fieldIndex) => (
                <DropdownMenuItem key={fieldIndex} onClick={field.onClick} disabled={field.disabled}>
                  {field.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
