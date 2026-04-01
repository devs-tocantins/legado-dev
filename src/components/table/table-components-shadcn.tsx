import { Ref } from "react";
import {
  ScrollerProps,
  TableComponents as TableComponentsType,
} from "react-virtuoso";

const TableComponents = {
  Scroller: function Scroller(
    props: ScrollerProps & { ref?: Ref<HTMLDivElement> }
  ) {
    return (
      <div
        {...props}
        ref={props.ref}
        className="rounded-md border overflow-auto"
      />
    );
  },
  Table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <table
      {...props}
      className="w-full caption-bottom text-sm"
      style={{ borderCollapse: "separate" }}
    />
  ),
  TableHead: function TableHead(
    props: React.HTMLAttributes<HTMLTableSectionElement> & {
      ref?: Ref<HTMLTableSectionElement>;
    }
  ) {
    return (
      <thead
        {...props}
        ref={props.ref}
        className="[&_tr]:border-b bg-muted/50"
      />
    );
  } as unknown as TableComponentsType["TableHead"],
  TableFoot: function TableFoot(
    props: React.HTMLAttributes<HTMLTableSectionElement>
  ) {
    return <tfoot {...props} />;
  } as unknown as TableComponentsType["TableFoot"],
  TableRow: function TableRow(
    props: React.HTMLAttributes<HTMLTableRowElement>
  ) {
    return (
      <tr
        {...props}
        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
      />
    );
  },
  TableBody: function BodyTable(
    props: React.HTMLAttributes<HTMLTableSectionElement> & {
      ref?: Ref<HTMLTableSectionElement>;
    }
  ) {
    return (
      <tbody
        {...props}
        ref={props.ref}
        className="[&_tr:last-child]:border-0"
      />
    );
  },
};

export default TableComponents;
