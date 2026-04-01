import { useGetSubmissionsService } from "@/services/api/services/submissions";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { createQueryKeys } from "@/services/react-query/query-key-factory";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  SubmissionFilterType,
  SubmissionSortType,
} from "../submission-filter-types";

export const submissionsQueryKeys = createQueryKeys(["submissions"], {
  list: () => ({
    key: [],
    sub: {
      by: ({
        sort,
        filter,
      }: {
        filter: SubmissionFilterType | undefined;
        sort?: SubmissionSortType | undefined;
      }) => ({
        key: [sort, filter],
      }),
    },
  }),
});

export const useGetSubmissionsQuery = ({
  sort,
  filter,
}: {
  filter?: SubmissionFilterType | undefined;
  sort?: SubmissionSortType | undefined;
} = {}) => {
  const fetch = useGetSubmissionsService();

  const query = useInfiniteQuery({
    queryKey: submissionsQueryKeys.list().sub.by({ sort, filter }).key,
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
