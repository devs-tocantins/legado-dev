"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import { PropsWithChildren, useCallback, useMemo, useState } from "react";
import { useGetTransactionsQuery, transactionsQueryKeys } from "./queries/queries";
import { TableVirtuoso } from "react-virtuoso";
import TableComponents from "@/components/table/table-components-shadcn";
import { Transaction } from "@/services/api/types/transaction";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useDeleteTransactionService } from "@/services/api/services/transactions";
import removeDuplicatesFromArrayObjects from "@/services/helpers/remove-duplicates-from-array-of-objects";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import TransactionFilter from "./transaction-filter";
import { useRouter, useSearchParams } from "next/navigation";
import { TransactionFilterType, TransactionSortType } from "./transaction-filter-types";
import { SortEnum } from "@/services/api/types/sort-type";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

type TransactionKeys = keyof Transaction;

function SortableHeader(
  props: PropsWithChildren<{
    column: TransactionKeys;
    orderBy: TransactionKeys;
    order: SortEnum;
    onSort: (event: React.MouseEvent<unknown>, property: TransactionKeys) => void;
    className?: string;
  }>
) {
  return (
    <th className={`h-10 px-3 text-left align-middle font-medium text-muted-foreground ${props.className ?? ""}`}>
      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={(e) => props.onSort(e, props.column)}>
        {props.children}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}

function Actions({ transaction }: { transaction: Transaction }) {
  const { confirmDialog } = useConfirmDialog();
  const fetchDelete = useDeleteTransactionService();
  const queryClient = useQueryClient();
  const { t } = useTranslation("admin-panel-transactions");

  const handleDelete = async () => {
    const isConfirmed = await confirmDialog({
      title: t("admin-panel-transactions:confirm.delete.title"),
      message: t("admin-panel-transactions:confirm.delete.message"),
    });

    if (isConfirmed) {
      const searchParams = new URLSearchParams(window.location.search);
      let filter: TransactionFilterType | undefined = undefined;
      let sort: TransactionSortType | undefined = { order: SortEnum.DESC, orderBy: "id" };
      if (searchParams.get("filter")) filter = JSON.parse(searchParams.get("filter")!);
      if (searchParams.get("sort")) sort = JSON.parse(searchParams.get("sort")!);

      const previousData = queryClient.getQueryData<
        InfiniteData<{ nextPage: number; data: Transaction[] }>
      >(transactionsQueryKeys.list().sub.by({ sort, filter }).key);
      await queryClient.cancelQueries({ queryKey: transactionsQueryKeys.list().key });
      const newData = {
        ...previousData,
        pages: previousData?.pages.map((page) => ({
          ...page,
          data: page?.data.filter((item) => item.id !== transaction.id),
        })),
      };
      queryClient.setQueryData(transactionsQueryKeys.list().sub.by({ sort, filter }).key, newData);
      await fetchDelete({ id: transaction.id });
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" render={<Link href={`/admin-panel/transactions/edit/${transaction.id}`} />}>
        {t("admin-panel-transactions:actions.edit")}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="h-8 w-8" />}>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
            {t("admin-panel-transactions:actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Transactions() {
  const { t } = useTranslation("admin-panel-transactions");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [{ order, orderBy }, setSort] = useState<{ order: SortEnum; orderBy: TransactionKeys }>(() => {
    const s = searchParams.get("sort");
    return s ? JSON.parse(s) : { order: SortEnum.DESC, orderBy: "id" };
  });

  const handleRequestSort = (_: React.MouseEvent<unknown>, property: TransactionKeys) => {
    const isAsc = orderBy === property && order === SortEnum.ASC;
    const sp = new URLSearchParams(window.location.search);
    const newOrder = isAsc ? SortEnum.DESC : SortEnum.ASC;
    sp.set("sort", JSON.stringify({ order: newOrder, orderBy: property }));
    setSort({ order: newOrder, orderBy: property });
    router.push(window.location.pathname + "?" + sp.toString());
  };

  const filter = useMemo(() => {
    const f = searchParams.get("filter");
    return f ? (JSON.parse(f) as TransactionFilterType) : undefined;
  }, [searchParams]);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetTransactionsQuery({ filter, sort: { order, orderBy } });

  const handleScroll = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const result = useMemo(() => {
    const r = (data?.pages.flatMap((page) => page?.data) as Transaction[]) ?? [];
    return removeDuplicatesFromArrayObjects(r, "id");
  }, [data]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("admin-panel-transactions:title")}
        </h1>
        <div className="flex items-center gap-2">
          <TransactionFilter />
          <Button className="bg-green-600 hover:bg-green-700" render={<Link href="/admin-panel/transactions/create" />}>
            {t("admin-panel-transactions:actions.create")}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <TableVirtuoso
          style={{ height: 500 }}
          data={result}
          components={TableComponents}
          endReached={handleScroll}
          overscan={20}
          useWindowScroll
          increaseViewportBy={400}
          fixedHeaderContent={() => (
            <>
              <tr className="border-b">
                <SortableHeader column="id" orderBy={orderBy} order={order} onSort={handleRequestSort} className="w-[100px]">
                  {t("admin-panel-transactions:table.column1")}
                </SortableHeader>
                <th className="h-10 w-[150px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {t("admin-panel-transactions:table.column2")}
                </th>
                <SortableHeader column="amount" orderBy={orderBy} order={order} onSort={handleRequestSort} className="w-[100px]">
                  {t("admin-panel-transactions:table.column3")}
                </SortableHeader>
                <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground">
                  {t("admin-panel-transactions:table.column4")}
                </th>
                <th className="h-10 w-[180px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {t("admin-panel-transactions:table.column5")}
                </th>
                <th className="h-10 w-[130px] px-3"></th>
              </tr>
              {isFetchingNextPage && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <div className="h-1 w-full overflow-hidden bg-muted">
                      <div className="h-full w-1/3 animate-pulse bg-primary" />
                    </div>
                  </td>
                </tr>
              )}
            </>
          )}
          itemContent={(_index, transaction) => (
            <>
              <td className="p-3 w-[100px]">{transaction?.id?.substring(0, 8)}...</td>
              <td className="p-3 w-[150px]">
                {transaction?.category && (
                  <Badge variant="secondary">
                    {t(`admin-panel-transactions:category.${transaction.category}`)}
                  </Badge>
                )}
              </td>
              <td className="p-3 w-[100px]">{transaction?.amount}</td>
              <td className="p-3">{transaction?.description ?? "-"}</td>
              <td className="p-3 w-[180px]">
                {transaction?.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : ""}
              </td>
              <td className="p-3 w-[130px]">
                {!!transaction && <Actions transaction={transaction} />}
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Transactions, { roles: [RoleEnum.ADMIN] });
