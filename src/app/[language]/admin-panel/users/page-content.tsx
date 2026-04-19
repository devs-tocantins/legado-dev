"use client";

import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import { PropsWithChildren, useCallback, useMemo, useState } from "react";
import { useGetUsersQuery, usersQueryKeys } from "./queries/queries";
import { TableVirtuoso } from "react-virtuoso";
import TableComponents from "@/components/table/table-components-shadcn";
import { User } from "@/services/api/types/user";
import useAuth from "@/services/auth/use-auth";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import {
  useDeleteUsersService,
  usePatchUserService,
} from "@/services/api/services/users";
import removeDuplicatesFromArrayObjects from "@/services/helpers/remove-duplicates-from-array-of-objects";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import UserFilter from "./user-filter";
import { useRouter, useSearchParams } from "next/navigation";
import { UserFilterType, UserSortType } from "./user-filter-types";
import { SortEnum } from "@/services/api/types/sort-type";
import Link from "@/components/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Ban, MoreHorizontal, ShieldOff } from "lucide-react";

type UsersKeys = keyof User;

function SortableHeader(
  props: PropsWithChildren<{
    column: UsersKeys;
    orderBy: UsersKeys;
    order: SortEnum;
    onSort: (event: React.MouseEvent<unknown>, property: UsersKeys) => void;
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

function Actions({ user }: { user: User }) {
  const { user: authUser } = useAuth();
  const { confirmDialog } = useConfirmDialog();
  const fetchDelete = useDeleteUsersService();
  const fetchPatch = usePatchUserService();
  const queryClient = useQueryClient();
  const canDelete = user.id !== authUser?.id;
  const canBan = user.id !== authUser?.id;
  const { t } = useTranslation("admin-panel-users");

  const getQueryParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const searchParamsFilter = searchParams.get("filter");
    const searchParamsSort = searchParams.get("sort");
    const filter: UserFilterType | undefined = searchParamsFilter
      ? JSON.parse(searchParamsFilter)
      : undefined;
    const sort: UserSortType = searchParamsSort
      ? JSON.parse(searchParamsSort)
      : { order: SortEnum.DESC, orderBy: "id" };
    return { filter, sort };
  };

  const handleDelete = async () => {
    const isConfirmed = await confirmDialog({
      title: t("admin-panel-users:confirm.delete.title"),
      message: t("admin-panel-users:confirm.delete.message"),
    });

    if (isConfirmed) {
      const { filter, sort } = getQueryParams();

      const previousData = queryClient.getQueryData<
        InfiniteData<{ nextPage: number; data: User[] }>
      >(usersQueryKeys.list().sub.by({ sort, filter }).key);

      await queryClient.cancelQueries({ queryKey: usersQueryKeys.list().key });

      const newData = {
        ...previousData,
        pages: previousData?.pages.map((page) => ({
          ...page,
          data: page?.data.filter((item) => item.id !== user.id),
        })),
      };

      queryClient.setQueryData(
        usersQueryKeys.list().sub.by({ sort, filter }).key,
        newData
      );

      await fetchDelete({ id: user.id });
    }
  };

  const handleToggleBan = async () => {
    const isBanning = !user.isBanned;
    const isConfirmed = await confirmDialog({
      title: isBanning ? "Banir usuário?" : "Remover banimento?",
      message: isBanning
        ? `Tem certeza que deseja banir @${user.firstName} ${user.lastName}? O usuário não poderá mais fazer login.`
        : `Deseja remover o banimento de ${user.firstName} ${user.lastName}?`,
    });

    if (isConfirmed) {
      const { filter, sort } = getQueryParams();

      await queryClient.cancelQueries({ queryKey: usersQueryKeys.list().key });

      const previousData = queryClient.getQueryData<
        InfiniteData<{ nextPage: number; data: User[] }>
      >(usersQueryKeys.list().sub.by({ sort, filter }).key);

      const newData = {
        ...previousData,
        pages: previousData?.pages.map((page) => ({
          ...page,
          data: page?.data.map((item) =>
            item.id === user.id ? { ...item, isBanned: isBanning } : item
          ),
        })),
      };

      queryClient.setQueryData(
        usersQueryKeys.list().sub.by({ sort, filter }).key,
        newData
      );

      await fetchPatch({ id: user.id, data: { isBanned: isBanning } });
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        render={<Link href={`/admin-panel/users/edit/${user.id}`} />}
      >
        {t("admin-panel-users:actions.edit")}
      </Button>
      {(canDelete || canBan) && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="icon" className="h-8 w-8" />
            }
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canBan && (
              <DropdownMenuItem
                className={
                  user.isBanned
                    ? "text-emerald-600 focus:text-emerald-600"
                    : "text-amber-600 focus:text-amber-600"
                }
                onClick={handleToggleBan}
              >
                {user.isBanned ? (
                  <>
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Remover banimento
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    Banir usuário
                  </>
                )}
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                {t("admin-panel-users:actions.delete")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function Users() {
  const { t: tUsers } = useTranslation("admin-panel-users");
  const { t: tRoles } = useTranslation("admin-panel-roles");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [{ order, orderBy }, setSort] = useState<{
    order: SortEnum;
    orderBy: UsersKeys;
  }>(() => {
    const searchParamsSort = searchParams.get("sort");
    if (searchParamsSort) return JSON.parse(searchParamsSort);
    return { order: SortEnum.DESC, orderBy: "id" };
  });

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: UsersKeys
  ) => {
    const isAsc = orderBy === property && order === SortEnum.ASC;
    const searchParams = new URLSearchParams(window.location.search);
    const newOrder = isAsc ? SortEnum.DESC : SortEnum.ASC;
    const newOrderBy = property;
    searchParams.set(
      "sort",
      JSON.stringify({ order: newOrder, orderBy: newOrderBy })
    );
    setSort({ order: newOrder, orderBy: newOrderBy });
    router.push(window.location.pathname + "?" + searchParams.toString());
  };

  const filter = useMemo(() => {
    const searchParamsFilter = searchParams.get("filter");
    if (searchParamsFilter)
      return JSON.parse(searchParamsFilter) as UserFilterType;
    return undefined;
  }, [searchParams]);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetUsersQuery({ filter, sort: { order, orderBy } });

  const handleScroll = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const result = useMemo(() => {
    const result =
      (data?.pages.flatMap((page) => page?.data) as User[]) ?? ([] as User[]);
    return removeDuplicatesFromArrayObjects(result, "id");
  }, [data]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {tUsers("admin-panel-users:title")}
        </h1>
        <div className="flex items-center gap-2">
          <UserFilter />
          <Button
            className="bg-green-600 hover:bg-green-700"
            render={<Link href="/admin-panel/users/create" />}
          >
            {tUsers("admin-panel-users:actions.create")}
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
                <th className="h-10 w-[50px] px-3"></th>
                <SortableHeader
                  column="id"
                  orderBy={orderBy}
                  order={order}
                  onSort={handleRequestSort}
                  className="w-[100px]"
                >
                  {tUsers("admin-panel-users:table.column1")}
                </SortableHeader>
                <th className="h-10 w-[200px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {tUsers("admin-panel-users:table.column2")}
                </th>
                <SortableHeader
                  column="email"
                  orderBy={orderBy}
                  order={order}
                  onSort={handleRequestSort}
                >
                  {tUsers("admin-panel-users:table.column3")}
                </SortableHeader>
                <th className="h-10 w-[80px] px-3 text-left align-middle font-medium text-muted-foreground">
                  {tUsers("admin-panel-users:table.column4")}
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
          itemContent={(_index, user) => (
            <>
              <td className="p-3 w-[50px]">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.photo?.path}
                    alt={`${user?.firstName} ${user?.lastName}`}
                  />
                  <AvatarFallback className="text-xs">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </td>
              <td className="p-3 w-[100px]">{user?.id}</td>
              <td className="p-3 w-[200px]">
                <div className="flex items-center gap-2">
                  <span>
                    {user?.firstName} {user?.lastName}
                  </span>
                  {user?.isBanned && (
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-destructive/10 text-destructive">
                      <Ban className="h-2.5 w-2.5" />
                      BANIDO
                    </span>
                  )}
                </div>
              </td>
              <td className="p-3">{user?.email}</td>
              <td className="p-3 w-[80px]">
                {tRoles(`role.${user?.role?.id}`)}
              </td>
              <td className="p-3 w-[150px]">
                {!!user && <Actions user={user} />}
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Users, {
  roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR],
});
