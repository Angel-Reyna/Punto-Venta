import { AppError } from "../src/utils/AppError";
import {
  buildPaginationMeta,
  getDateRange,
  getPagination
} from "../src/utils/pagination";

describe("pagination utilities", () => {
  it("applies safe defaults and caps pageSize", () => {
    const pagination = getPagination({ page: "2", pageSize: "500" }, {
      defaultPageSize: 25,
      maxPageSize: 100
    });

    expect(pagination).toEqual({
      page: 2,
      pageSize: 100,
      skip: 100,
      take: 100
    });
  });

  it("rejects invalid pages", () => {
    expect(() => getPagination({ page: "0" })).toThrow(AppError);
    expect(() => getPagination({ pageSize: "abc" })).toThrow(AppError);
  });

  it("builds pagination metadata", () => {
    expect(
      buildPaginationMeta(
        {
          page: 2,
          pageSize: 25,
          skip: 25,
          take: 25
        },
        51
      )
    ).toEqual({
      page: 2,
      pageSize: 25,
      total: 51,
      totalPages: 3
    });
  });

  it("rejects inverted date ranges", () => {
    expect(() =>
      getDateRange({
        dateFrom: "2026-05-10",
        dateTo: "2026-05-01"
      })
    ).toThrow(AppError);
  });
});
