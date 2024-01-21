import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

import DOMPurify from "dompurify";

import restaurants from "../../scraping/vegan.json";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { Checkbox } from "./components/ui/checkbox";

type Restaurant = (typeof restaurants)[number];

const uniqueRestaurantPrefix = new Map<string, Restaurant>();
for (const restaurant of restaurants) {
  const [name] = restaurant.title.split("-");
  uniqueRestaurantPrefix.set(name.trim(), restaurant);
}

const restaurantTableData = restaurants.map((restaurant) => ({
  restaurant,
}));

const uniqueRestaurantTableData: { restaurant: Restaurant }[] = [];
for (const restaurant of restaurants) {
  const [name] = restaurant.title.split("-");
  const restaurantsWithDash = uniqueRestaurantPrefix.get(name.trim());

  if (restaurantsWithDash?.title === restaurant.title) {
    uniqueRestaurantTableData.push({ restaurant });
  }
}

const DINE_OUT_BASE_URL = "https://www.dineoutvancouver.com";

const columnHelper = createColumnHelper<{ restaurant: Restaurant }>();

function App() {
  const columns = [columnHelper.accessor("restaurant", {})];

  const [data, setData] = useState(restaurantTableData);

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4">
      <div className="flex items-center space-x-2 pb-4">
        <Checkbox
          id="remove-duplicates"
          onCheckedChange={(checked) => {
            console.log("checked", checked);
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
      <div className="grid-cols-1 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {table.getRowModel().rows.map((row, i) => {
          return row.getVisibleCells().map((cell) => {
            const item = cell.getValue<Restaurant>();
            return (
              <a
                href={`${DINE_OUT_BASE_URL}/${item.detailURL}`}
                target="_blank"
                referrerPolicy="no-referrer"
                key={i}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>
                      {i + 1}. {item.title}
                    </CardTitle>
                    <CardDescription
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(item.description),
                      }}
                    ></CardDescription>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={item.primary_image_url}
                      width="300px"
                      alt={item.title}
                      loading="lazy"
                    />
                  </CardContent>
                </Card>
              </a>
            );
          });
        })}
      </div>
    </div>
  );
}

export default App;
