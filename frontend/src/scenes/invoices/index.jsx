import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockDataInvoices } from "../../data/mockData";
import Header from "../../components/Header";

const Invoices = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const columns = [
    { field: "id", headerName: "ID" },
    {
      field: "name",
      headerName: "Producto",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "phone",
      headerName: "Stocks",
      flex: 1,
    },
    {
      field: "cost",
      headerName: "Valor",
      flex: 1,
      renderCell: (params) => (
        <Typography color={colors.greenAccent[500]}>
          ${params.row.cost}
        </Typography>
      ),
    },
    {
      field: "date",
      headerName: "Descripcion",
      flex: 1.5,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
    },
  ];

  return (
    <Box m="20px">
      <Header title="PRODUCTOS" subtitle="Lista de productos disponibles" />
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button
          variant="contained"
          color="primary"
          size="medium"
          sx={{ fontSize: "1.0rem", textTransform: "none" }}
          onClick={() => alert("Agregar producto")}
        >
          Agregar producto
        </Button>
      </Box>
      <Box
        m="0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
            fontSize: "1.0rem", // Agranda la letra de la tabla
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
            fontSize: "1.0rem", // Agranda la letra de los encabezados
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
            fontSize: "1.0rem", // Agranda la letra del footer
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid checkboxSelection rows={mockDataInvoices} columns={columns} />
      </Box>
    </Box>
  );
};

export default Invoices;