import {
  Box,
  Typography,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockDataTeam } from "../../data/mockData";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import Header from "../../components/Header";
import React, { useState, useEffect } from "react";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    primerNombre: "",
    segundoNombre: "",
    apellido: "",
    age: "",
    phone: "",
    email: "",
    access: "user",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewData, setViewData] = useState({});

  // Leer usuarios de localStorage al iniciar
  const getInitialRows = () => {
    const stored = localStorage.getItem("teamUsers");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [
          {
            id: 1,
            primerNombre: "Juan",
            segundoNombre: "",
            apellido: "Perdomo",
            age: "",
            phone: "3134800728",
            email: "admin@gmail.com",
            access: "admin",
          },
        ];
      }
    }
    return [
      {
        id: 1,
        primerNombre: "Juan",
        segundoNombre: "",
        apellido: "Perdomo",
        age: "",
        phone: "3134800728",
        email: "admin@gmail.com",
        access: "admin",
      },
    ];
  };

  const [rows, setRows] = useState(getInitialRows);

  // Guardar usuarios en localStorage cada vez que cambian
  useEffect(() => {
    localStorage.setItem("teamUsers", JSON.stringify(rows));
  }, [rows]);

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

  const handleCreateChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleCreateUser = () => {
    setRows([
      ...rows,
      {
        ...newUser,
        id: rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1,
      },
    ]);
    setCreateDialogOpen(false);
    setNewUser({
      primerNombre: "",
      segundoNombre: "",
      apellido: "",
      age: "",
      phone: "",
      email: "",
      access: "user",
      password: "",
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = () => {
    setRows(rows.map(row => (row.id === editData.id ? { ...editData } : row)));
    setEditDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    setRows(rows.filter(row => row.id !== selectedRow.id));
    setDeleteDialogOpen(false);
  };

  // Cambia las columnas para mostrar primer nombre, segundo nombre y apellido
  const columns = [
    { field: "id", headerName: "ID" },
    {
      field: "cedula",
      headerName: "C.C",
      flex: 1,
      cellClassName: "name-column--cell",
    },
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
      field: "accessLevel",
      headerName: "Rol",
      flex: 1,
      renderCell: ({ row: { access } }) => {
        return (
          <Box
            width="60%"
            m="0 auto"
            p="5px"
            display="flex"
            justifyContent="center"
            backgroundColor={
              access === "admin"
                ? colors.greenAccent[600]
                : access === "manager"
                ? colors.greenAccent[700]
                : colors.greenAccent[700]
            }
            borderRadius="4px"
          >
            {access === "admin" && <AdminPanelSettingsOutlinedIcon />}
            {access === "manager" && <SecurityOutlinedIcon />}
            {access === "user" && <LockOpenOutlinedIcon />}
            <Typography color={colors.grey[100]} sx={{ ml: "5px" }}>
              {access}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => {
            e.stopPropagation(); // Evita que se abra el modal de detalles
            handleMenuOpen(e, params.row);
          }}
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
      <Header title="TEAM" subtitle="Equipo de trabajo" />
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
          Crear usuario
        </Button>
      </Box>
      <Box
        m="40px 0 0 0"
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
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          onRowClick={(params) => {
            setViewData(params.row);
            setViewDialogOpen(true);
          }}
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
            Editar Usuario
          </DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="C.C"
              name="cedula"
              value={editData.cedula || ""}
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
              label="Rol"
              name="access"
              value={editData.access || ""}
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
              select
              SelectProps={{
                native: true,
              }}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">Empleado</option>
            </TextField>
            <TextField
              margin="dense"
              label="Contraseña"
              name="password"
              type={showEditPassword ? "text" : "password"}
              value={editData.password || ""}
              onChange={handleEditChange}
              fullWidth
              InputLabelProps={{ style: { color: colors.grey[300] } }}
              InputProps={{
                style: {
                  color: colors.grey[100],
                  backgroundColor: colors.primary[400],
                  borderRadius: 4,
                },
                endAdornment: (
                  <IconButton
                    onClick={() => setShowEditPassword((show) => !show)}
                    edge="end"
                    sx={{ color: colors.grey[300] }}
                  >
                    {showEditPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
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
            ¿Eliminar usuario?
          </DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que deseas eliminar este usuario?
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
        {/* Diálogo de creación de usuario */}
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
            Crear Usuario
          </DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="C.C"
              name="cedula"
              value={newUser.cedula || ""}
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
              label="Primer Nombre"
              name="primerNombre"
              value={newUser.primerNombre}
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
              value={newUser.segundoNombre}
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
              value={newUser.apellido}
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
              value={newUser.age}
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
              value={newUser.phone}
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
              value={newUser.email}
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
              label="Rol"
              name="access"
              value={newUser.access}
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
              select
              SelectProps={{
                native: true,
              }}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">Empleado</option>
            </TextField>
            <TextField
              margin="dense"
              label="Contraseña"
              name="password"
              type={showPassword ? "text" : "password"}
              value={newUser.password}
              onChange={handleCreateChange}
              fullWidth
              InputLabelProps={{ style: { color: colors.grey[300] } }}
              InputProps={{
                style: {
                  color: colors.grey[100],
                  backgroundColor: colors.primary[400],
                  borderRadius: 4,
                },
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword((show) => !show)}
                    edge="end"
                    sx={{ color: colors.grey[300] }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
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
              onClick={handleCreateUser}
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
        {/* Modal para ver información completa del usuario */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: colors.primary[500],
              color: colors.grey[100],
              borderRadius: 3,
              minWidth: 350,
            },
          }}
        >
          <DialogTitle sx={{ color: colors.greenAccent[400] }}>Información del Usuario</DialogTitle>
          <DialogContent>
            <Typography><b>C.C:</b> {viewData.cedula || viewData.registrarId || ""}</Typography>
            <Typography><b>Primer Nombre:</b> {viewData.primerNombre}</Typography>
            <Typography><b>Segundo Nombre:</b> {viewData.segundoNombre}</Typography>
            <Typography><b>Apellido:</b> {viewData.apellido}</Typography>
            <Typography><b>Edad:</b> {viewData.age}</Typography>
            <Typography><b>Teléfono:</b> {viewData.phone}</Typography>
            <Typography><b>Email:</b> {viewData.email}</Typography>
            <Typography><b>Rol:</b> {viewData.access}</Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setViewDialogOpen(false)}
              sx={{
                color: colors.grey[100],
                backgroundColor: colors.blueAccent[600],
                '&:hover': { backgroundColor: colors.blueAccent[700] },
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Team;
