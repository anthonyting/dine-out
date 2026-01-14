import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

import DOMPurify from "dompurify";
import useLocalStorageState from "use-local-storage-state";

import restaurantsChunk1 from "../../scraping/dist/menu/chunks/restaurants.1.min.json";
import {
  ColumnFiltersState,
  FilterFn,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  AnchorHTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Checkbox } from "./components/ui/checkbox";
import { Progress } from "./components/ui/progress";
import { Input } from "./components/ui/input";

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

      const valuesToCheck = filterValue.toLowerCase().split(" ");
      if (
        valuesToCheck.every(
          (value) =>
            restaurant.menu.toLowerCase().includes(value) ||
            restaurant.title.toLowerCase().includes(value) ||
            restaurant.description?.toLowerCase().includes(value)
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
            Math.min(
              Math.max(
                progress,
                Math.ceil(((i + 1) / TOTAL_CHUNK_COUNT) * 100)
              ),
              100
            )
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
      value: import.meta.env.VITE_DEFAULT_SEARCH_INPUT,
    },
  ]);

  const [isUsingUniqueData, setIsUsingUniqueData] = useState<boolean>(true);
  const [showOnlySelected, setShowOnlySelected] = useState<boolean>(false);
  const [selectedRestaurants, setSelectedRestaurants] = useLocalStorageState<
    Record<string, boolean>
  >("selectedRestaurants", {
    defaultValue: {},
  });

  // todo: move state handling/filters to tanstack table
  const processSelectedRestaurants = useCallback(
    (selected: typeof selectedRestaurants, data: TableData[]) =>
      data.filter((value) => selected[value.restaurant.id]),
    []
  );

  const unProcessedData = isUsingUniqueData
    ? uniqueRestaurantTableData
    : restaurantTableData;

  const data = useMemo(
    () =>
      showOnlySelected
        ? processSelectedRestaurants(selectedRestaurants, unProcessedData)
        : unProcessedData,
    [
      showOnlySelected,
      selectedRestaurants,
      unProcessedData,
      processSelectedRestaurants,
    ]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="p-4">
      <section className="pb-3">
        <div className="flex space-x-4">
          {table.getAllColumns().map((column) => {
            return (
              <Input
                key={column.id}
                placeholder={`Search ${column.id} keyword`}
                value={column.getFilterValue() as string ?? ''}
                onChange={(e) => column.setFilterValue(e.target.value)}
              />
            );
          })}
        </div>
        <Progress
          value={progress}
          className={`h-0.5 transition-opacity duration-500 ease-out my-2`}
          style={{
            opacity: progress === 100 ? 0 : 1,
          }}
        />
        <div className="flex flex-row gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-only-selected"
              checked={showOnlySelected}
              onCheckedChange={(checked) => {
                setShowOnlySelected(!!checked);
              }}
            />
            <label
              htmlFor="show-only-selected"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show only selected
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remove-duplicates"
              checked={isUsingUniqueData}
              onCheckedChange={(checked) => {
                setIsUsingUniqueData(!!checked);
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
      </section>
      <section className="grid-cols-1 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.length ? (
          rows.map((row, i) => {
            const restaurant = row.getValue<Restaurant>("restaurant");
            const linkProps: AnchorHTMLAttributes<HTMLAnchorElement> = {
              href: `${DINE_OUT_BASE_URL}${restaurant.detailURL}`,
              target: "_blank",
              referrerPolicy: "no-referrer",
              onClick: (e) => e.stopPropagation(),
            };
            return (
              <Card
                className="h-full"
                key={`${restaurant.id}-${i}`}
                onClick={() => {
                  setSelectedRestaurants({
                    ...selectedRestaurants,
                    [restaurant.id]: !selectedRestaurants[restaurant.id],
                  });
                }}
              >
                <CardHeader className="flex-row justify-between">
                  <a
                    {...linkProps}
                    className="text-blue-600 dark:text-blue-500 hover:underline"
                  >
                    <CardTitle>
                      {i + 1}. {restaurant.title}
                    </CardTitle>
                  </a>
                  <Checkbox
                    className="!my-0 h-6 w-6 ml-2"
                    id={`include-${restaurant.id}`}
                    checked={!!selectedRestaurants[restaurant.id]}
                    onCheckedChange={(checked) => {
                      setSelectedRestaurants({
                        ...selectedRestaurants,
                        [restaurant.id]: !!checked,
                      });
                    }}
                    title={`Select ${restaurant.title}`}
                  />
                </CardHeader>

                <CardContent className="flex flex-col gap-y-3">
                  <CardDescription
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        restaurant.description ?? "No description"
                      ),
                    }}
                  />
                  <a {...linkProps} className="w-80">
                    {restaurant.primary_image_url ? (
                      <img
                        className="max-h-[300px]"
                        src={restaurant.primary_image_url}
                        alt={restaurant.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="bg-black/20 text-center align-middle h-[300px] w-full leading-[300px] text-muted-foreground">
                        No image available
                      </div>
                    )}
                  </a>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-xl p-4">No restaurants available</p>
        )}
      </section>
    </div>
  );
}

export default App;
