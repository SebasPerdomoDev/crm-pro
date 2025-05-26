import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockDataContacts } from "../../data/mockData";
import Header from "../../components/Header";
import { useTheme } from "@mui/material";
import React, { useState } from "react";

const Contacts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    primerNombre: "",
    segundoNombre: "",
    apellido: "",
    age: "",
    phone: "",
    email: "",
    address: "",
    city: "",
  });

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

  const handleCreateChange = (e) => {
    setNewClient({ ...newClient, [e.target.name]: e.target.value });
  };

  const handleCreateClient = () => {
    // Aquí deberías agregar el cliente a tu backend o estado global
    setCreateDialogOpen(false);
    setNewClient({
      primerNombre: "",
      segundoNombre: "",
      apellido: "",
      age: "",
      phone: "",
      email: "",
      address: "",
      city: "",
    });
  };

  const [editData, setEditData] = useState({});
  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = () => {
    // Aquí deberías actualizar los datos en tu backend o estado global
    setEditDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    // Aquí deberías eliminar el usuario en tu backend o estado global
    setDeleteDialogOpen(false);
  };

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "registrarId", headerName: "C.C" },
    {
      field: "primerNombre",
      headerName: "Primer Nombre",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "segundoNombre",
      headerName: "Segundo Nombre",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "apellido",
      headerName: "Apellido",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "age",
      headerName: "Edad",
      type: "number",
      headerAlign: "left",
      align: "left",
    },
    {
      field: "phone",
      headerName: "Telefono",
      flex: 1,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
    {
      field: "address",
      headerName: "Direccion",
      flex: 1,
    },
    {
      field: "city",
      headerName: "Ciudad",
      flex: 1,
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
      <Header
        title="CLIENTES"
        subtitle="Lista de clientes potenciales"
      />
      <Box display="flex" justifyContent="flex-end" mb={0.5}>
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
          onClick={() => setCreateDialogOpen(true)}
        >
          Crear cliente
        </Button>
      </Box>
      <Box
        m="10px 0 0 0"
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
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.grey[100]} !important`,
            fontSize: "1.0rem",
          },
        }}
      >
        <DataGrid
          rows={mockDataContacts}
          columns={columns}
          components={{ Toolbar: GridToolbar }}
        />
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
            Editar Cliente
          </DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Primer Nombre"
              name="primerNombre"
              value={editData.primerNombre || ""}
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
              label="Segundo Nombre"
              name="segundoNombre"
              value={editData.segundoNombre || ""}
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
              label="Apellido"
              name="apellido"
              value={editData.apellido || ""}
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
              label="Edad"
              name="age"
              value={editData.age || ""}
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
              label="Teléfono"
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
              label="Email"
              name="email"
              value={editData.email || ""}
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
              label="Dirección"
              name="address"
              value={editData.address || ""}
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
              label="Ciudad"
              name="city"
              value={editData.city || ""}
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
            ¿Eliminar cliente?
          </DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que deseas eliminar este cliente?
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
        {/* Diálogo de creación de cliente */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: colors.primary[500],
              color: colors.grey[100],
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ color: colors.greenAccent[400] }}>
            Crear Cliente
          </DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Primer Nombre"
              name="primerNombre"
              value={newClient.primerNombre}
              onChange={handleCreateChange}
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
              label="Segundo Nombre"
              name="segundoNombre"
              value={newClient.segundoNombre}
              onChange={handleCreateChange}
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
              label="Apellido"
              name="apellido"
              value={newClient.apellido}
              onChange={handleCreateChange}
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
              label="Edad"
              name="age"
              value={newClient.age}
              onChange={handleCreateChange}
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
              label="Teléfono"
              name="phone"
              value={newClient.phone}
              onChange={handleCreateChange}
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
              label="Email"
              name="email"
              value={newClient.email}
              onChange={handleCreateChange}
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
              label="Dirección"
              name="address"
              value={newClient.address}
              onChange={handleCreateChange}
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
              label="Ciudad"
              name="city"
              value={newClient.city}
              onChange={handleCreateChange}
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
              onClick={() => setCreateDialogOpen(false)}
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
              onClick={handleCreateClient}
              variant="contained"
              sx={{
                backgroundColor: colors.greenAccent[600],
                color: colors.grey[900],
                "&:hover": {
                  backgroundColor: colors.greenAccent[700],
                },
              }}
            >
              Crear
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Contacts;