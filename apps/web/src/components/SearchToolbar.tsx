import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";

type SearchToolbarProps = {
  helperText?: string;
  label?: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  query: string;
  resultCount: number;
  totalCount?: number;
};

export function SearchToolbar({
  helperText,
  label = "Buscar",
  onQueryChange,
  placeholder,
  query,
  resultCount,
  totalCount,
}: SearchToolbarProps) {
  const trimmedQuery = query.trim();
  const showingFilteredResults = Boolean(trimmedQuery);
  const countLabel = showingFilteredResults
    ? `${resultCount} resultado${resultCount === 1 ? "" : "s"}`
    : `${totalCount ?? resultCount} registro${(totalCount ?? resultCount) === 1 ? "" : "s"}`;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TextField
              fullWidth
              label={label}
              value={query}
              placeholder={placeholder}
              onChange={(event) => onQueryChange(event.target.value)}
              inputProps={{
                "aria-label": label,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: trimmedQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => onQueryChange("")}
                      aria-label="Limpiar búsqueda"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              }}
            />
          </Box>

          <Chip
            color={showingFilteredResults ? "primary" : "default"}
            variant={showingFilteredResults ? "filled" : "outlined"}
            label={countLabel}
            sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
          />
        </Stack>

        {helperText && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {helperText}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
