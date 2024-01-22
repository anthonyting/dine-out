import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

import DOMPurify from "dompurify";

import restaurants from "../../scraping/restaurants-with-menu.json";
import {
  ColumnFiltersState,
  FilterFn,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useState } from "react";
import { Checkbox } from "./components/ui/checkbox";
import { DebouncedInput } from "./components/debouncedInput";

type Restaurant = (typeof restaurants)[number];
type TableData = { restaurant: Restaurant };

const uniqueRestaurantPrefix = new Map<string, Restaurant>();
for (const restaurant of restaurants) {
  const [name] = restaurant.title.split("-");
  uniqueRestaurantPrefix.set(name.trim(), restaurant);
}

const restaurantTableData = restaurants.map((restaurant) => ({
  restaurant,
}));

const uniqueRestaurantTableData: TableData[] = [];
for (const restaurant of restaurants) {
  const [name] = restaurant.title.split("-");
  const restaurantsWithDash = uniqueRestaurantPrefix.get(name.trim());

  if (restaurantsWithDash?.title === restaurant.title) {
    uniqueRestaurantTableData.push({ restaurant });
  }
}

const DINE_OUT_BASE_URL = "https://www.dineoutvancouver.com";

const columnHelper = createColumnHelper<TableData>();

function App() {
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

  const columns = [
    columnHelper.accessor("restaurant", {
      enableColumnFilter: true,
      filterFn: restaurantFilterFn,
    }),
  ];

  const [data, setData] = useState(restaurantTableData);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "restaurant",
      value: "vegan",
    },
  ]);

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

  return (
    <div className="p-4">
      <div className="flex pb-4 space-x-4">
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
              if (checked) {
                setData(uniqueRestaurantTableData);
              } else {
                setData(restaurantTableData);
              }
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
      <div className="grid-cols-1 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {table.getRowModel().rows.map((row, i) => {
          const restaurant = row.getValue<Restaurant>("restaurant");
          return (
            <a
              href={`${DINE_OUT_BASE_URL}/${restaurant.detailURL}`}
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
      </div>
    </div>
  );
}

export default App;
