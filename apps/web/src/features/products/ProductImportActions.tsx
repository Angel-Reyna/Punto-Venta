import { Button, Stack } from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";

type ProductImportActionsProps = {
  isDownloadingTemplate: boolean;
  isImportingExcel: boolean;
  onDownloadTemplate: () => void;
  onImportExcel: (file: File | undefined) => void | Promise<void>;
};

export function ProductImportActions({
  isDownloadingTemplate,
  isImportingExcel,
  onDownloadTemplate,
  onImportExcel,
}: ProductImportActionsProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      sx={{ alignItems: "stretch" }}
    >
      <Button
        fullWidth
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={onDownloadTemplate}
        disabled={isDownloadingTemplate || isImportingExcel}
      >
        {isDownloadingTemplate ? "Descargando..." : "Formato Excel"}
      </Button>

      <Button
        fullWidth
        component="label"
        variant="outlined"
        startIcon={<UploadIcon />}
        disabled={isImportingExcel || isDownloadingTemplate}
      >
        {isImportingExcel ? "Importando..." : "Importar"}
        <input
          hidden
          type="file"
          accept=".xlsx"
          disabled={isImportingExcel}
          onChange={(event) => {
            void onImportExcel(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </Button>
    </Stack>
  );
}
