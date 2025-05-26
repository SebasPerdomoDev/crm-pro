import {
  Box,
  Typography,
  useTheme,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockDataInvoices } from "../../data/mockData";
import Header from "../../components/Header";
import React, { useState } from "react";

const Invoices = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editData, setEditData] = useState({});

  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setEditData(selectedRow);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = () => {
    // Aquí deberías actualizar los datos en tu backend o estado global
    setEditDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    // Aquí deberías eliminar el producto en tu backend o estado global
    setDeleteDialogOpen(false);
  };

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
    {
      field: "actions",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => handleMenuOpen(e, params.row)}
          sx={{
            color: colors.greenAccent[300],
            backgroundColor: colors.primary[600],
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: colors.greenAccent[700],
            },
          }}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="PRODUCTOS" subtitle="Lista de productos disponibles" />
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: colors.greenAccent[600],
            color: "#fff",
            fontWeight: "bold",
            borderRadius: "30px",
            px: 3,
            py: 1.2,
            boxShadow: "0px 4px 15px rgba(5, 5, 5, 0.08)",
            textTransform: "none",
            fontSize: "1rem",
            "&:hover": {
              backgroundColor: colors.greenAccent[700],
            },
          }}
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
            fontSize: "1.0rem",
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
            fontSize: "1.0rem",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
            fontSize: "1.0rem",
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid rows={mockDataInvoices} columns={columns} />
        {/* Menú de acciones */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: colors.primary[500],
              color: colors.grey[100],
              boxShadow: 3,
              borderRadius: 2,
            },
          }}
        >
          <MenuItem
            onClick={handleEditClick}
            sx={{
              "&:hover": {
                backgroundColor: colors.greenAccent[700],
                color: colors.grey[900],
              },
            }}
          >
            Editar
          </MenuItem>
          <MenuItem
            onClick={handleDeleteClick}
            sx={{
              "&:hover": {
                backgroundColor: colors.redAccent[700],
                color: colors.grey[900],
              },
            }}
          >
            Eliminar
          </MenuItem>
        </Menu>
        {/* Diálogo de edición */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: colors.primary[500],
              color: colors.grey[100],
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ color: colors.greenAccent[400] }}>
            Editar Producto
          </DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Producto"
              name="name"
              value={editData.name || ""}
              onChange={handleEditChange}
              fullWidth
              InputLabelProps={{ style: { color: colors.grey[300] } }}
              InputProps={{
                style: {
                  color: colors.grey[100],
                  backgroundColor: colors.primary[400],
                  borderRadius: 4,
                },
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Stocks"
              name="phone"
              value={editData.phone || ""}
              onChange={handleEditChange}
              fullWidth
              InputLabelProps={{ style: { color: colors.grey[300] } }}
              InputProps={{
                style: {
                  color: colors.grey[100],
                  backgroundColor: colors.primary[400],
                  borderRadius: 4,
                },
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Valor"
              name="cost"
              value={editData.cost || ""}
              onChange={handleEditChange}
              fullWidth
              InputLabelProps={{ style: { color: colors.grey[300] } }}
              InputProps={{
                style: {
                  color: colors.grey[100],
                  backgroundColor: colors.primary[400],
                  borderRadius: 4,
                },
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Descripción"
              name="date"
              value={editData.date || ""}
              onChange={handleEditChange}
              fullWidth
              InputLabelProps={{ style: { color: colors.grey[300] } }}
              InputProps={{
                style: {
                  color: colors.grey[100],
                  backgroundColor: colors.primary[400],
                  borderRadius: 4,
                },
              }}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setEditDialogOpen(false)}
              sx={{
                color: colors.grey[100],
                backgroundColor: colors.redAccent[600],
                "&:hover": {
                  backgroundColor: colors.redAccent[700],
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditSave}
              variant="contained"
              sx={{
                backgroundColor: colors.greenAccent[600],
                color: colors.grey[900],
                "&:hover": {
                  backgroundColor: colors.greenAccent[700],
                },
              }}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
        {/* Diálogo de confirmación de eliminación */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: colors.primary[500],
              color: colors.grey[100],
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ color: colors.redAccent[400] }}>
            ¿Eliminar producto?
          </DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que deseas eliminar este producto?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              sx={{
                color: colors.grey[100],
                backgroundColor: colors.blueAccent[600],
                "&:hover": {
                  backgroundColor: colors.blueAccent[700],
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              sx={{
                backgroundColor: colors.redAccent[600],
                color: colors.grey[900],
                "&:hover": {
                  backgroundColor: colors.redAccent[700],
                },
              }}
              variant="contained"
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Invoices;