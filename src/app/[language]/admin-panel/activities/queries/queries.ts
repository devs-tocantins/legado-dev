import { useGetActivitiesService } from "@/services/api/services/activities";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { createQueryKeys } from "@/services/react-query/query-key-factory";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ActivityFilterType, ActivitySortType } from "../activity-filter-types";

export const activitiesQueryKeys = createQueryKeys(["activities"], {
  list: () => ({
    key: [],
    sub: {
      by: ({
        sort,
        filter,
      }: {
        filter: ActivityFilterType | undefined;
        sort?: ActivitySortType | undefined;
      }) => ({
        key: [sort, filter],
      }),
    },
  }),
});

export const useGetActivitiesQuery = ({
  sort,
  filter,
}: {
  filter?: ActivityFilterType | undefined;
  sort?: ActivitySortType | undefined;
} = {}) => {
  const fetch = useGetActivitiesService();

  const query = useInfiniteQuery({
    queryKey: activitiesQueryKeys.list().sub.by({ sort, filter }).key,
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
