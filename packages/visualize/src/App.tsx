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
import { useCallback, useEffect, useMemo, useState } from "react";
import { Checkbox } from "./components/ui/checkbox";
import { Progress } from "./components/ui/progress";
import { Restaurant, TableData } from "./types";
import { RestaurantCard } from "./components/RestaurantCard";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useRef } from "react";
import { exportSelectedData, importSelectedData } from "./lib/dataTransfer";

const TOTAL_CHUNK_COUNT = Number(process.env.DINE_OUT_CHUNK_COUNT);

if (isNaN(TOTAL_CHUNK_COUNT)) {
  throw new Error("DINE_OUT_CHUNK_COUNT is not a number");
}

const columnHelper = createColumnHelper<TableData>();

const matchesSearch = (restaurant: Restaurant, filterValue: string) => {
  if (!filterValue || typeof filterValue !== "string") {
    return true;
  }

  const valuesToCheck = filterValue.toLowerCase().split(" ");
  return valuesToCheck.every(
    (value) =>
      restaurant.menu.toLowerCase().includes(value) ||
      restaurant.title.toLowerCase().includes(value) ||
      restaurant.description?.toLowerCase().includes(value),
  );
};

function App() {
  const [progress, setProgress] = useState(
    Math.ceil((1 / TOTAL_CHUNK_COUNT) * 100),
  );
  const restaurantFilterFn = useCallback<FilterFn<TableData>>(
    (row, columnId, filterValue: string) => {
      if (columnId !== "restaurant") {
        return true;
      }

      return matchesSearch(row.getValue<Restaurant>(columnId), filterValue);
    },
    [],
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
                Math.ceil(((i + 1) / TOTAL_CHUNK_COUNT) * 100),
              ),
              100,
            ),
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
    [restaurantFilterFn],
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // todo: move state handling/filters to tanstack table
  const processSelectedRestaurants = useCallback(
    (selected: typeof selectedRestaurants, data: TableData[]) =>
      data.filter((value) => selected[value.restaurant.id]),
    [],
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
    ],
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

  const invertSelection = useCallback(() => {
    const searchFilter =
      (table.getColumn("restaurant")?.getFilterValue() as string) ?? "";

    const visibleDataBeforeToggle = unProcessedData.filter((item) =>
      matchesSearch(item.restaurant, searchFilter),
    );

    setSelectedRestaurants((prev) => {
      const next = { ...prev };
      visibleDataBeforeToggle.forEach((item) => {
        next[item.restaurant.id] = !prev[item.restaurant.id];
      });
      return next;
    });
  }, [unProcessedData, table, setSelectedRestaurants]);

  return (
    <div className="p-4">
      <section className="pb-3">
        <div className="flex space-x-4">
          {table.getAllColumns().map((column) => {
            return (
              <Input
                key={column.id}
                placeholder={`Search ${column.id} keyword`}
                value={(column.getFilterValue() as string) ?? ""}
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
            <Button onClick={invertSelection} size="sm">
              Invert selection
            </Button>
            <Button onClick={() => setSelectedRestaurants({})} size="sm">
              Deselect all
            </Button>
            {/* todo: use an input component with type file instead of this */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  importSelectedData(
                    file,
                    (data) => {
                      setSelectedRestaurants(data);
                      alert("Successfully imported selected restaurants");
                    },
                    (error) => {
                      alert(error);
                    },
                  );
                }
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Import/Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  Import
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportSelectedData(selectedRestaurants)}
                >
                  Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            return (
              <RestaurantCard
                key={`${restaurant.id}-${i}`}
                restaurant={restaurant}
                index={i}
                setSelectedRestaurants={setSelectedRestaurants}
                isSelected={selectedRestaurants[restaurant.id] ?? false}
              />
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
