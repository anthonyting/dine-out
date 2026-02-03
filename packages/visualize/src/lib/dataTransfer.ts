import { saveAs } from "file-saver";

const VERSION = "1";

export interface ExportData {
  version: string;
  selectedRestaurants: Record<string, boolean>;
}

export const exportSelectedData = (
  selectedRestaurants: Record<string, boolean>,
) => {
  const data: ExportData = {
    version: VERSION,
    selectedRestaurants,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  saveAs(blob, `dine-out-vancouver-selected.json`);
};

export const importSelectedData = (
  file: File,
  onSuccess: (data: Record<string, boolean>) => void,
  onError: (error: string) => void,
) => {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const json = JSON.parse(event.target?.result as string);

      if (json.version && json.selectedRestaurants) {
        onSuccess(json.selectedRestaurants);
      } else {
        onError("Invalid file format: Missing version or selectedRestaurants");
      }
    } catch (e) {
      onError("Failed to parse JSON file");
    }
  };

  reader.onerror = () => {
    onError("Failed to read file");
  };

  reader.readAsText(file);
};
