"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import { PropsWithChildren, useCallback, useMemo, useState } from "react";
import {
  useGetGamificationProfilesQuery,
  gamificationProfilesQueryKeys,
} from "./queries/queries";
import { TableVirtuoso } from "react-virtuoso";
import TableComponents from "@/components/table/table-components-shadcn";
import { GamificationProfile } from "@/services/api/types/gamification-profile";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useDeleteGamificationProfileService } from "@/services/api/services/gamification-profiles";
import removeDuplicatesFromArrayObjects from "@/services/helpers/remove-duplicates-from-array-of-objects";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GamificationProfileFilterType,
  GamificationProfileSortType,
} from "./gamification-profile-filter-types";
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

type GamificationProfileKeys = keyof GamificationProfile;

function SortableHeader(
  props: PropsWithChildren<{
    column: GamificationProfileKeys;
    orderBy: GamificationProfileKeys;
    order: SortEnum;
    onSort: (event: React.MouseEvent<unknown>, property: GamificationProfileKeys) => void;
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

function Actions({ profile }: { profile: GamificationProfile }) {
  const { confirmDialog } = useConfirmDialog();
  const fetchDelete = useDeleteGamificationProfileService();
  const queryClient = useQueryClient();
  const { t } = useTranslation("admin-panel-gamification-profiles");

  const handleDelete = async () => {
    const isConfirmed = await confirmDialog({
      title: t("admin-panel-gamification-profiles:confirm.delete.title"),
      message: t("admin-panel-gamification-profiles:confirm.delete.message"),
    });

    if (isConfirmed) {
      const searchParams = new URLSearchParams(window.location.search);
      let filter: GamificationProfileFilterType | undefined = undefined;
      let sort: GamificationProfileSortType | undefined = { order: SortEnum.DESC, orderBy: "id" };
      if (searchParams.get("filter")) filter = JSON.parse(searchParams.get("filter")!);
      if (searchParams.get("sort")) sort = JSON.parse(searchParams.get("sort")!);

      const previousData = queryClient.getQueryData<
        InfiniteData<{ nextPage: number; data: GamificationProfile[] }>
      >(gamificationProfilesQueryKeys.list().sub.by({ sort, filter }).key);
      await queryClient.cancelQueries({ queryKey: gamificationProfilesQueryKeys.list().key });
      const newData = {
        ...previousData,
        pages: previousData?.pages.map((page) => ({
          ...page,
          data: page?.data.filter((item) => item.id !== profile.id),
        })),
      };
      queryClient.setQueryData(gamificationProfilesQueryKeys.list().sub.by({ sort, filter }).key, newData);
      await fetchDelete({ id: profile.id });
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" render={<Link href={`/admin-panel/gamification-profiles/edit/${profile.id}`} />}>
        {t("admin-panel-gamification-profiles:actions.edit")}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="h-8 w-8" />}>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
            {t("admin-panel-gamification-profiles:actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function GamificationProfiles() {
  const { t } = useTranslation("admin-panel-gamification-profiles");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [{ order, orderBy }, setSort] = useState<{
    order: SortEnum;
    orderBy: GamificationProfileKeys;
  }>(() => {
    const s = searchParams.get("sort");
    return s ? JSON.parse(s) : { order: SortEnum.DESC, orderBy: "id" };
  });

  const handleRequestSort = (_: React.MouseEvent<unknown>, property: GamificationProfileKeys) => {
    const isAsc = orderBy === property && order === SortEnum.ASC;
    const sp = new URLSearchParams(window.location.search);
    const newOrder = isAsc ? SortEnum.DESC : SortEnum.ASC;
    sp.set("sort", JSON.stringify({ order: newOrder, orderBy: property }));
    setSort({ order: newOrder, orderBy: property });
    router.push(window.location.pathname + "?" + sp.toString());
  };

  const filter = useMemo(() => {
    const f = searchParams.get("filter");
    return f ? (JSON.parse(f) as GamificationProfileFilterType) : undefined;
  }, [searchParams]);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetGamificationProfilesQuery({ filter, sort: { order, orderBy } });

  const handleScroll = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const result = useMemo(() => {
    const r = (data?.pages.flatMap((page) => page?.data) as GamificationProfile[]) ?? [];
    return removeDuplicatesFromArrayObjects(r, "id");
  }, [data]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("admin-panel-gamification-profiles:title")}
        </h1>
        <div className="flex items-center gap-2">
          <Button className="bg-green-600 hover:bg-green-700" render={<Link href="/admin-panel/gamification-profiles/create" />}>
            {t("admin-panel-gamification-profiles:actions.create")}
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
                  {t("admin-panel-gamification-profiles:table.column1")}
                </SortableHeader>
                <th className="h-10 w-[150px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {t("admin-panel-gamification-profiles:table.column2")}
                </th>
                <SortableHeader column="totalXp" orderBy={orderBy} order={order} onSort={handleRequestSort} className="w-[120px]">
                  {t("admin-panel-gamification-profiles:table.column3")}
                </SortableHeader>
                <th className="h-10 w-[120px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {t("admin-panel-gamification-profiles:table.column4")}
                </th>
                <th className="h-10 w-[100px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {t("admin-panel-gamification-profiles:table.column5")}
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
          itemContent={(_index, profile) => (
            <>
              <td className="p-3 w-[100px]">{profile?.id?.substring(0, 8)}...</td>
              <td className="p-3 w-[150px]">{profile?.username ?? "-"}</td>
              <td className="p-3 w-[120px]">{profile?.totalXp} XP</td>
              <td className="p-3 w-[120px]">{profile?.currentMonthlyXp} XP</td>
              <td className="p-3 w-[100px]">{profile?.gratitudeTokens}</td>
              <td className="p-3 w-[130px]">
                {!!profile && <Actions profile={profile} />}
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
}

export default withPageRequiredAuth(GamificationProfiles, { roles: [RoleEnum.ADMIN] });
