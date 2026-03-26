import { useGetGamificationProfilesService } from "@/services/api/services/gamification-profiles";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { createQueryKeys } from "@/services/react-query/query-key-factory";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  GamificationProfileFilterType,
  GamificationProfileSortType,
} from "../gamification-profile-filter-types";

export const gamificationProfilesQueryKeys = createQueryKeys(
  ["gamification-profiles"],
  {
    list: () => ({
      key: [],
      sub: {
        by: ({
          sort,
          filter,
        }: {
          filter: GamificationProfileFilterType | undefined;
          sort?: GamificationProfileSortType | undefined;
        }) => ({
          key: [sort, filter],
        }),
      },
    }),
  }
);

export const useGetGamificationProfilesQuery = ({
  sort,
  filter,
}: {
  filter?: GamificationProfileFilterType | undefined;
  sort?: GamificationProfileSortType | undefined;
} = {}) => {
  const fetch = useGetGamificationProfilesService();

  const query = useInfiniteQuery({
    queryKey: gamificationProfilesQueryKeys.list().sub.by({ sort, filter }).key,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const { status, data } = await fetch(
        {
          page: pageParam,
          limit: 10,
          filters: filter,
          sort: sort ? [sort] : undefined,
        },
        {
          signal,
        }
      );

      if (status === HTTP_CODES_ENUM.OK) {
        return {
          data: data.data,
          nextPage: data.hasNextPage ? pageParam + 1 : undefined,
        };
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage?.nextPage;
    },
    gcTime: 0,
  });

  return query;
};
