"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import { PropsWithChildren, useCallback, useMemo, useState } from "react";
import { useGetActivitiesQuery, activitiesQueryKeys } from "./queries/queries";
import { TableVirtuoso } from "react-virtuoso";
import TableComponents from "@/components/table/table-components-shadcn";
import { Activity } from "@/services/api/types/activity";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useDeleteActivityService } from "@/services/api/services/activities";
import removeDuplicatesFromArrayObjects from "@/services/helpers/remove-duplicates-from-array-of-objects";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import ActivityFilter from "./activity-filter";
import { useRouter, useSearchParams } from "next/navigation";
import { ActivityFilterType, ActivitySortType } from "./activity-filter-types";
import { SortEnum } from "@/services/api/types/sort-type";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

type ActivityKeys = keyof Activity;

function SortableHeader(
  props: PropsWithChildren<{
    column: ActivityKeys;
    orderBy: ActivityKeys;
    order: SortEnum;
    onSort: (event: React.MouseEvent<unknown>, property: ActivityKeys) => void;
    className?: string;
  }>
) {
  return (
    <th className={`h-10 px-3 text-left align-middle font-medium text-muted-foreground ${props.className ?? ""}`}>
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

function Actions({ activity }: { activity: Activity }) {
  const { confirmDialog } = useConfirmDialog();
  const fetchDelete = useDeleteActivityService();
  const queryClient = useQueryClient();
  const { t } = useTranslation("admin-panel-activities");

  const handleDelete = async () => {
    const isConfirmed = await confirmDialog({
      title: t("admin-panel-activities:confirm.delete.title"),
      message: t("admin-panel-activities:confirm.delete.message"),
    });

    if (isConfirmed) {
      const searchParams = new URLSearchParams(window.location.search);
      const searchParamsFilter = searchParams.get("filter");
      const searchParamsSort = searchParams.get("sort");

      let filter: ActivityFilterType | undefined = undefined;
      let sort: ActivitySortType | undefined = { order: SortEnum.DESC, orderBy: "id" };

      if (searchParamsFilter) filter = JSON.parse(searchParamsFilter);
      if (searchParamsSort) sort = JSON.parse(searchParamsSort);

      const previousData = queryClient.getQueryData<
        InfiniteData<{ nextPage: number; data: Activity[] }>
      >(activitiesQueryKeys.list().sub.by({ sort, filter }).key);

      await queryClient.cancelQueries({ queryKey: activitiesQueryKeys.list().key });

      const newData = {
        ...previousData,
        pages: previousData?.pages.map((page) => ({
          ...page,
          data: page?.data.filter((item) => item.id !== activity.id),
        })),
      };

      queryClient.setQueryData(
        activitiesQueryKeys.list().sub.by({ sort, filter }).key,
        newData
      );

      await fetchDelete({ id: activity.id });
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" render={<Link href={`/admin-panel/activities/edit/${activity.id}`} />}>
          {t("admin-panel-activities:actions.edit")}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="h-8 w-8" />}>
            <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDelete}
          >
            {t("admin-panel-activities:actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Activities() {
  const { t } = useTranslation("admin-panel-activities");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [{ order, orderBy }, setSort] = useState<{
    order: SortEnum;
    orderBy: ActivityKeys;
  }>(() => {
    const searchParamsSort = searchParams.get("sort");
    if (searchParamsSort) return JSON.parse(searchParamsSort);
    return { order: SortEnum.DESC, orderBy: "id" };
  });

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: ActivityKeys) => {
    const isAsc = orderBy === property && order === SortEnum.ASC;
    const searchParams = new URLSearchParams(window.location.search);
    const newOrder = isAsc ? SortEnum.DESC : SortEnum.ASC;
    searchParams.set("sort", JSON.stringify({ order: newOrder, orderBy: property }));
    setSort({ order: newOrder, orderBy: property });
    router.push(window.location.pathname + "?" + searchParams.toString());
  };

  const filter = useMemo(() => {
    const f = searchParams.get("filter");
    return f ? (JSON.parse(f) as ActivityFilterType) : undefined;
  }, [searchParams]);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetActivitiesQuery({ filter, sort: { order, orderBy } });

  const handleScroll = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const result = useMemo(() => {
    const r = (data?.pages.flatMap((page) => page?.data) as Activity[]) ?? ([] as Activity[]);
    return removeDuplicatesFromArrayObjects(r, "id");
  }, [data]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("admin-panel-activities:title")}
        </h1>
        <div className="flex items-center gap-2">
          <ActivityFilter />
          <Button className="bg-green-600 hover:bg-green-700" render={<Link href="/admin-panel/activities/create" />}>
              {t("admin-panel-activities:actions.create")}
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
                  {t("admin-panel-activities:table.column1")}
                </SortableHeader>
                <SortableHeader column="title" orderBy={orderBy} order={order} onSort={handleRequestSort}>
                  {t("admin-panel-activities:table.column2")}
                </SortableHeader>
                <SortableHeader column="fixedReward" orderBy={orderBy} order={order} onSort={handleRequestSort} className="w-[120px]">
                  {t("admin-panel-activities:table.column3")}
                </SortableHeader>
                <th className="h-10 w-[120px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {t("admin-panel-activities:table.column4")}
                </th>
                <th className="h-10 w-[100px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {t("admin-panel-activities:table.column5")}
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
          itemContent={(_index, activity) => (
            <>
              <td className="p-3 w-[100px]">{activity?.id?.substring(0, 8)}...</td>
              <td className="p-3">{activity?.title}</td>
              <td className="p-3 w-[120px]">{activity?.fixedReward} XP</td>
              <td className="p-3 w-[120px]">
                {activity?.requiresProof
                  ? t("admin-panel-activities:table.yes")
                  : t("admin-panel-activities:table.no")}
              </td>
              <td className="p-3 w-[100px]">{activity?.cooldownHours}h</td>
              <td className="p-3 w-[150px]">
                {!!activity && <Actions activity={activity} />}
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Activities, { roles: [RoleEnum.ADMIN] });
