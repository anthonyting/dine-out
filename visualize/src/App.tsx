import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

import DOMPurify from "dompurify";

import restaurantsChunk1 from "../../scraping/dist/menu/chunks/restaurants.1.min.json";
import {
  ColumnFiltersState,
  FilterFn,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Checkbox } from "./components/ui/checkbox";
import { DebouncedInput } from "./components/debouncedInput";
import { Progress } from "./components/ui/progress";

type Restaurant = (typeof restaurantsChunk1)[number];
type TableData = { restaurant: Restaurant };

const DINE_OUT_BASE_URL = "https://www.dineoutvancouver.com";
const TOTAL_CHUNK_COUNT = Number(process.env.DINE_OUT_CHUNK_COUNT);

if (isNaN(TOTAL_CHUNK_COUNT)) {
  throw new Error("DINE_OUT_CHUNK_COUNT is not a number");
}

const columnHelper = createColumnHelper<TableData>();

function App() {
  const [progress, setProgress] = useState(
    Math.ceil((1 / TOTAL_CHUNK_COUNT) * 100)
  );
  const restaurantFilterFn = useCallback<FilterFn<TableData>>(
    (row, columnId, filterValue: string) => {
      if (!filterValue || typeof filterValue !== "string") {
        return true;
      }

      if (columnId !== "restaurant") {
        return true;
      }

      const restaurant = row.getValue<Restaurant>(columnId);

      const valuesToCheck = filterValue.split(" ");
      if (
        valuesToCheck.every((value) =>
          restaurant.menu.toLowerCase().includes(value)
        )
      ) {
        return true;
      }

      return false;
    },
    []
  );

  const [allRestaurants, setAllRestaurants] =
    useState<Restaurant[]>(restaurantsChunk1);

  useEffect(() => {
    let ignore = false;
    let finalTimeout: ReturnType<typeof setTimeout>;
    async function getAllRestaurants() {
      for (let i = 2; i <= TOTAL_CHUNK_COUNT; i++) {
        const chunk = await import(
          `../../scraping/dist/menu/chunks/restaurants.${i}.min.json`
        );
        if (!ignore) {
          setProgress((progress) =>
            Math.max(progress, Math.ceil(((i + 1) / TOTAL_CHUNK_COUNT) * 100))
          );
          setAllRestaurants((allRestaurants) => [
            ...allRestaurants,
            ...chunk.default,
          ]);
        }
      }
      if (!ignore) {
        finalTimeout = setTimeout(() => setProgress(100), 100);
      }
    }
    getAllRestaurants().catch(console.error);
    return () => {
      clearTimeout(finalTimeout);
      ignore = true;
    };
  }, []);

  const uniqueRestaurantPrefix = useMemo(() => {
    const uniqueRestaurantPrefix = new Map<string, Restaurant>();
    for (const restaurant of allRestaurants) {
      const [name] = restaurant.title.split("-");
      uniqueRestaurantPrefix.set(name.trim(), restaurant);
    }
    return uniqueRestaurantPrefix;
  }, [allRestaurants]);

  const restaurantTableData = useMemo(() => {
    return allRestaurants.map((restaurant) => ({
      restaurant,
    }));
  }, [allRestaurants]);

  const uniqueRestaurantTableData = useMemo(() => {
    const uniqueRestaurantTableData: TableData[] = [];
    for (const restaurant of allRestaurants) {
      const [name] = restaurant.title.split("-");
      const restaurantsWithDash = uniqueRestaurantPrefix.get(name.trim());

      if (restaurantsWithDash?.title === restaurant.title) {
        uniqueRestaurantTableData.push({ restaurant });
      }
    }
    return uniqueRestaurantTableData;
  }, [uniqueRestaurantPrefix, allRestaurants]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("restaurant", {
        enableColumnFilter: true,
        filterFn: restaurantFilterFn,
      }),
    ],
    [restaurantFilterFn]
  );

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "restaurant",
      value: "vegan",
    },
  ]);

  const [isUsingUniqueData, setIsUsingUniqueData] = useState<boolean>(true);

  const table = useReactTable({
    data: isUsingUniqueData ? uniqueRestaurantTableData : restaurantTableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
  });

  return (
    <div className="p-4">
      <section className="pb-3">
        <div className="flex pb-2 space-x-4">
          {table.getAllColumns().map((column) => {
            return (
              <DebouncedInput
                placeholder={`Search ${column.id} keyword`}
                value={column.getFilterValue() as string}
                onChange={(value) => column.setFilterValue(value)}
              />
            );
          })}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remove-duplicates"
              onCheckedChange={(checked) => {
                setIsUsingUniqueData(!!checked.valueOf());
              }}
            />
            <label
              htmlFor="remove-duplicates"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remove duplicates
            </label>
          </div>
        </div>
        <Progress
          value={progress}
          className={`h-0.5 transition-opacity duration-500 ease-out`}
          style={{
            opacity: progress === 100 ? 0 : 1,
          }}
        />
      </section>
      <section className="grid-cols-1 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {table.getRowModel().rows.map((row, i) => {
          const restaurant = row.getValue<Restaurant>("restaurant");
          return (
            <a
              href={`${DINE_OUT_BASE_URL}${restaurant.detailURL}`}
              target="_blank"
              referrerPolicy="no-referrer"
              key={i}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    {i + 1}. {restaurant.title}
                  </CardTitle>
                  <CardDescription
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(restaurant.description),
                    }}
                  ></CardDescription>
                </CardHeader>
                <CardContent>
                  <img
                    src={restaurant.primary_image_url}
                    width="300px"
                    alt={restaurant.title}
                    loading="lazy"
                  />
                </CardContent>
              </Card>
            </a>
          );
        })}
      </section>
    </div>
  );
}

export default App;
