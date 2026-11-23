export interface PageInfo {
  page: number;
  limit: number;
  skip: number;
}

export function getPage(page = 1, limit = 20): PageInfo {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

export function paginated<T>(items: T[], total: number, pageInfo: PageInfo) {
  return {
    data: items,
    meta: {
      total,
      page: pageInfo.page,
      limit: pageInfo.limit,
      totalPages: Math.ceil(total / pageInfo.limit),
    },
  };
}
