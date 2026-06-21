"use client";

import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type SearchItem = {
  type: "client" | "surface";
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
};

export function SearchCommand({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SearchItem[];
}) {
  const router = useRouter();
  const clients = items.filter((item) => item.type === "client");
  const surfaces = items.filter((item) => item.type === "surface");

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search clients.dev"
      description="Search clients and configuration surfaces"
    >
      <CommandInput placeholder="Search clients and config surfaces…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Clients">
          {clients.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.title} ${item.keywords.join(" ")}`}
              onSelect={() => go(item.href)}
            >
              <span className="font-medium">{item.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {item.subtitle}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Surfaces">
          {surfaces.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.title} ${item.keywords.join(" ")}`}
              onSelect={() => go(item.href)}
            >
              <span className="font-medium">{item.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {item.subtitle}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
