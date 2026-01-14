import { Restaurant } from "@/types";
import DOMPurify from "dompurify";
import { AnchorHTMLAttributes } from "react";
import { Checkbox } from "../components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/card";
import { DINE_OUT_BASE_URL } from "@/constants";

export interface RestaurantCardProps {
  restaurant: Restaurant;
  index: number;
  setSelectedRestaurants: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  isSelected: boolean;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  setSelectedRestaurants,
  isSelected,
  index,
}) => {
  const linkProps: AnchorHTMLAttributes<HTMLAnchorElement> = {
    href: `${DINE_OUT_BASE_URL}${restaurant.detailURL}`,
    target: "_blank",
    referrerPolicy: "no-referrer",
    onClick: (e) => e.stopPropagation(),
  };
  return (
    <Card
      className="h-full"
      onClick={() =>
        setSelectedRestaurants((selectedRestaurants) => ({
          ...selectedRestaurants,
          [restaurant.id]: !isSelected,
        }))
      }
    >
      <CardHeader className="flex-row justify-between">
        <a
          {...linkProps}
          className="text-blue-600 dark:text-blue-500 hover:underline"
        >
          <CardTitle>
            {index + 1}. {restaurant.title}
          </CardTitle>
        </a>
        <Checkbox
          className="!my-0 h-6 w-6 ml-2"
          id={`include-${restaurant.id}`}
          checked={isSelected}
          title={`Select ${restaurant.title}`}
          // onCheckedChange is handled by the Card onClick
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
};
