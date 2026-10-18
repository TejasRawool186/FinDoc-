import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-none border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF]">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-xs font-mono border-collapse bg-white dark:bg-black text-black dark:text-white", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "border-b-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black [&_tr]:bg-black dark:[&_tr]:bg-white [&_tr]:text-white dark:[&_tr]:text-black [&_tr]:border-b-black dark:[&_tr]:border-b-white [&_tr]:hover:bg-black dark:[&_tr]:hover:bg-white [&_th]:bg-black dark:[&_th]:bg-white [&_th]:text-white dark:[&_th]:text-black",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "bg-white dark:bg-black text-black dark:text-white divide-y divide-zinc-200 dark:divide-neutral-800 [&_tr]:bg-white dark:[&_tr]:bg-black [&_tr]:text-black dark:[&_tr]:text-white",
      className
    )}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-black/20 dark:border-white/20 transition-colors hover:bg-zinc-100 dark:hover:bg-neutral-900 data-[state=selected]:bg-zinc-100 dark:data-[state=selected]:bg-neutral-900",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-11 px-4 text-left align-middle font-mono font-black text-white dark:text-black bg-black dark:bg-white text-[11px] tracking-wider uppercase select-none [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-3.5 align-middle font-mono text-xs text-black dark:text-white [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell };
