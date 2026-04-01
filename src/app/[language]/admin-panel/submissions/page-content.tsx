"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import { PropsWithChildren, useCallback, useMemo, useState } from "react";
import {
  useGetSubmissionsQuery,
  submissionsQueryKeys,
} from "./queries/queries";
import { TableVirtuoso } from "react-virtuoso";
import TableComponents from "@/components/table/table-components-shadcn";
import { Submission } from "@/services/api/types/submission";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useDeleteSubmissionService } from "@/services/api/services/submissions";
import removeDuplicatesFromArrayObjects from "@/services/helpers/remove-duplicates-from-array-of-objects";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import SubmissionFilter from "./submission-filter";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SubmissionFilterType,
  SubmissionSortType,
} from "./submission-filter-types";
import { SortEnum } from "@/services/api/types/sort-type";
import Link from "@/components/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

type SubmissionKeys = keyof Submission;

function SortableHeader(
  props: PropsWithChildren<{
    column: SubmissionKeys;
    orderBy: SubmissionKeys;
    order: SortEnum;
    onSort: (e: React.MouseEvent<unknown>, p: SubmissionKeys) => void;
    className?: string;
  }>
) {
  return (
    <th
      className={`h-10 px-3 text-left align-middle font-medium text-muted-foreground ${props.className ?? ""}`}
    >
      <button
        className="inline-flex items-center gap-1 hover:text-foreground"
        onClick={(e) => props.onSort(e, props.column)}
      >
        {props.children}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}

function Actions({ submission }: { submission: Submission }) {
  const { confirmDialog } = useConfirmDialog();
  const fetchDelete = useDeleteSubmissionService();
  const queryClient = useQueryClient();
  const { t } = useTranslation("admin-panel-submissions");

  const handleDelete = async () => {
    const isConfirmed = await confirmDialog({
      title: t("admin-panel-submissions:confirm.delete.title"),
      message: t("admin-panel-submissions:confirm.delete.message"),
    });
    if (isConfirmed) {
      const sp = new URLSearchParams(window.location.search);
      let filter: SubmissionFilterType | undefined = undefined;
      let sort: SubmissionSortType | undefined = {
        order: SortEnum.DESC,
        orderBy: "id",
      };
      if (sp.get("filter")) filter = JSON.parse(sp.get("filter")!);
      if (sp.get("sort")) sort = JSON.parse(sp.get("sort")!);

      const previousData = queryClient.getQueryData<
        InfiniteData<{ nextPage: number; data: Submission[] }>
      >(submissionsQueryKeys.list().sub.by({ sort, filter }).key);
      await queryClient.cancelQueries({
        queryKey: submissionsQueryKeys.list().key,
      });
      const newData = {
        ...previousData,
        pages: previousData?.pages.map((page) => ({
          ...page,
          data: page?.data.filter((item) => item.id !== submission.id),
        })),
      };
      queryClient.setQueryData(
        submissionsQueryKeys.list().sub.by({ sort, filter }).key,
        newData
      );
      await fetchDelete({ id: submission.id });
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        render={
          <Link href={`/admin-panel/submissions/edit/${submission.id}`} />
        }
      >
        {t("admin-panel-submissions:actions.edit")}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="icon" className="h-8 w-8" />}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDelete}
          >
            {t("admin-panel-submissions:actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Submissions() {
  const { t } = useTranslation("admin-panel-submissions");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [{ order, orderBy }, setSort] = useState<{
    order: SortEnum;
    orderBy: SubmissionKeys;
  }>(() => {
    const s = searchParams.get("sort");
    return s ? JSON.parse(s) : { order: SortEnum.DESC, orderBy: "id" };
  });

  const handleRequestSort = (
    _: React.MouseEvent<unknown>,
    property: SubmissionKeys
  ) => {
    const isAsc = orderBy === property && order === SortEnum.ASC;
    const sp = new URLSearchParams(window.location.search);
    const newOrder = isAsc ? SortEnum.DESC : SortEnum.ASC;
    sp.set("sort", JSON.stringify({ order: newOrder, orderBy: property }));
    setSort({ order: newOrder, orderBy: property });
    router.push(window.location.pathname + "?" + sp.toString());
  };

  const filter = useMemo(() => {
    const f = searchParams.get("filter");
    return f ? (JSON.parse(f) as SubmissionFilterType) : undefined;
  }, [searchParams]);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetSubmissionsQuery({ filter, sort: { order, orderBy } });

  const handleScroll = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const result = useMemo(() => {
    const r = (data?.pages.flatMap((p) => p?.data) as Submission[]) ?? [];
    return removeDuplicatesFromArrayObjects(r, "id");
  }, [data]);

  const statusVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default" as const;
      case "REJECTED":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("admin-panel-submissions:title")}
        </h1>
        <div className="flex items-center gap-2">
          <SubmissionFilter />
          <Button
            className="bg-green-600 hover:bg-green-700"
            render={<Link href="/admin-panel/submissions/create" />}
          >
            {t("admin-panel-submissions:actions.create")}
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
                <SortableHeader
                  column="id"
                  orderBy={orderBy}
                  order={order}
                  onSort={handleRequestSort}
                  className="w-[100px]"
                >
                  {t("admin-panel-submissions:table.column1")}
                </SortableHeader>
                <th className="h-10 w-[200px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {t("admin-panel-submissions:table.column2")}
                </th>
                <th className="h-10 w-[200px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {t("admin-panel-submissions:table.column3")}
                </th>
                <th className="h-10 w-[120px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {t("admin-panel-submissions:table.column4")}
                </th>
                <th className="h-10 w-[100px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {t("admin-panel-submissions:table.column5")}
                </th>
                <th className="h-10 w-[150px] px-3"></th>
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
          itemContent={(_i, sub) => (
            <>
              <td className="p-3 w-[100px]">{sub?.id?.substring(0, 8)}...</td>
              <td className="p-3 w-[200px]">
                {sub?.profileId?.substring(0, 8) ?? "-"}...
              </td>
              <td className="p-3 w-[200px]">
                {sub?.activityId?.substring(0, 8) ?? "-"}...
              </td>
              <td className="p-3 w-[120px]">
                {sub?.status && (
                  <Badge variant={statusVariant(sub.status)}>
                    {t(`admin-panel-submissions:status.${sub.status}`)}
                  </Badge>
                )}
              </td>
              <td className="p-3 w-[100px]">{sub?.awardedXp ?? 0} XP</td>
              <td className="p-3 w-[150px]">
                {!!sub && <Actions submission={sub} />}
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Submissions, { roles: [RoleEnum.ADMIN] });
