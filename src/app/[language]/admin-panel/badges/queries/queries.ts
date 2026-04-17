import { useGetAllBadgesService } from "@/services/api/services/badges";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { createQueryKeys } from "@/services/react-query/query-key-factory";
import { useQuery } from "@tanstack/react-query";

export const badgesQueryKeys = createQueryKeys(["admin-badges"], {
  list: () => ({
    key: [],
  }),
});

export const useGetBadgesQuery = () => {
  const fetch = useGetAllBadgesService();

  return useQuery({
    queryKey: badgesQueryKeys.list().key,
    queryFn: async () => {
      const { status, data } = await fetch();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
  });
};
