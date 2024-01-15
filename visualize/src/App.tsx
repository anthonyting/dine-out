import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

import DOMPurify from "dompurify";

import vegan from "../../scraping/vegan.json";

const DINE_OUT_BASE_URL = "https://www.dineoutvancouver.com";

function App() {
  return (
    <div className="p-4 grid-cols-1 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vegan.map((item, i) => {
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
      })}
    </div>
  );
}

export default App;
