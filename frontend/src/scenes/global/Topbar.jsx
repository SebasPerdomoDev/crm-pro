import { Box, IconButton, useTheme } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { ColorModeContext, tokens } from "../../theme";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);

  // Estado para el diálogo de edición de usuario
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // Datos tomados del sidebar: Juan Perdomo, Admin
  const [userData, setUserData] = useState({
    nombre: "Juan Perdomo",
    email: "usuario@ejemplo.com",
    password: "",
    telefono: "123456789",
    rol: "Admin",
  });

  // Estado para mostrar/ocultar contraseña nueva
  const [showPassword, setShowPassword] = useState(false);
  // Estado para la contraseña actual (para confirmar cambios)
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Estado para el diálogo de detalles del usuario
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Sincronizar datos del usuario logueado
  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("loggedUser") || "null");
    if (loggedUser) {
      setUserData({
        nombre: `${loggedUser.primerNombre || ""}${loggedUser.segundoNombre ? " " + loggedUser.segundoNombre : ""}${loggedUser.apellido ? " " + loggedUser.apellido : ""}`.trim(),
        email: loggedUser.email || "",
        password: loggedUser.password || "",
        telefono: loggedUser.phone || "",
        rol: loggedUser.access === "admin" ? "Admin" : loggedUser.access === "manager" ? "manager" : "empleado",
        primerNombre: loggedUser.primerNombre || "",
        segundoNombre: loggedUser.segundoNombre || "",
        apellido: loggedUser.apellido || "",
      });
    }
  }, []);

  const handleEditChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (e) => {
    setUserData({ ...userData, rol: e.target.value });
  };

  // Al guardar, actualizar también el usuario en localStorage y en teamUsers
  const handleEditSave = () => {
    const loggedUser = JSON.parse(localStorage.getItem("loggedUser") || "null");
    if (!loggedUser) return;
    // Actualizar loggedUser
    const updatedUser = {
      ...loggedUser,
      primerNombre: userData.primerNombre || userData.nombre.split(" ")[0] || "",
      segundoNombre: userData.segundoNombre || (userData.nombre.split(" ").length > 2 ? userData.nombre.split(" ")[1] : ""),
      apellido: userData.apellido || userData.nombre.split(" ").slice(-1)[0] || "",
      email: userData.email,
      phone: userData.telefono,
      password: userData.password,
      access: userData.rol === "Admin" ? "admin" : userData.rol,
    };
    localStorage.setItem("loggedUser", JSON.stringify(updatedUser));
    // Actualizar en teamUsers
    const users = JSON.parse(localStorage.getItem("teamUsers") || "[]");
    const idx = users.findIndex(u => u.email === loggedUser.email);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updatedUser };
      localStorage.setItem("teamUsers", JSON.stringify(users));
    }
    setEditDialogOpen(false);
    setCurrentPassword("");
  };

  // Obtener datos completos del usuario logueado desde teamUsers (incluyendo id y cedula)
  const getLoggedUserFullData = () => {
    const loggedUser = JSON.parse(localStorage.getItem("loggedUser") || "null");
    const users = JSON.parse(localStorage.getItem("teamUsers") || "[]");
    if (!loggedUser) return null;
    // Buscar por email (único)
    return users.find(u => u.email === loggedUser.email) || loggedUser;
  };

  // Mostrar modal de detalles del usuario (como en Team)
  const handleShowUserDetails = () => {
    setViewDialogOpen(true);
  };

  return (
    <Box display="flex" justifyContent="flex-end" p={2}>
      {/* ICONS */}
      <Box display="flex">
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
        
      </Box>
      {/* Diálogo para editar usuario */}
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
          Editar Información de Usuario
        </DialogTitle>
        <DialogContent>
          <InputBase
            fullWidth
            sx={{
              mb: 2,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: 2,
              px: 1,
            }}
            placeholder="Primer Nombre"
            name="primerNombre"
            value={userData.primerNombre || ""}
            onChange={handleEditChange}
          />
          <InputBase
            fullWidth
            sx={{
              mb: 2,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: 2,
              px: 1,
            }}
            placeholder="Segundo Nombre"
            name="segundoNombre"
            value={userData.segundoNombre || ""}
            onChange={handleEditChange}
          />
          <InputBase
            fullWidth
            sx={{
              mb: 2,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: 2,
              px: 1,
            }}
            placeholder="Apellido"
            name="apellido"
            value={userData.apellido || ""}
            onChange={handleEditChange}
          />
          <InputBase
            fullWidth
            sx={{
              mb: 2,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: 2,
              px: 1,
            }}
            placeholder="Correo electrónico"
            name="email"
            value={userData.email}
            onChange={handleEditChange}
          />
          <InputBase
            fullWidth
            type={showPassword ? "text" : "password"}
            sx={{
              mb: 2,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: 2,
              px: 1,
            }}
            placeholder="Contraseña nueva"
            name="password"
            value={userData.password}
            onChange={handleEditChange}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((show) => !show)}
                  edge="end"
                  sx={{ color: colors.grey[100] }}
                  tabIndex={-1}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />
          <InputBase
            fullWidth
            sx={{
              mb: 2,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: 2,
              px: 1,
            }}
            placeholder="Teléfono"
            name="telefono"
            value={userData.telefono}
            onChange={handleEditChange}
          />
          <Select
            fullWidth
            name="rol"
            value={userData.rol}
            onChange={handleRoleChange}
            sx={{
              mb: 2,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: 2,
              ".MuiSelect-icon": { color: colors.grey[100] },
              ".MuiOutlinedInput-notchedOutline": { border: 0 },
            }}
            inputProps={{
              style: {
                color: colors.grey[100],
                borderRadius: 2,
              },
            }}
          >
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="empleado">Empleado</MenuItem>
          </Select>
          <InputBase
            fullWidth
            type={showCurrentPassword ? "text" : "password"}
            sx={{
              mb: 2,
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              borderRadius: 2,
              px: 1,
            }}
            placeholder="Contraseña actual (requerida para guardar cambios)"
            name="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowCurrentPassword((show) => !show)}
                  edge="end"
                  sx={{ color: colors.grey[100] }}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
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
            disabled={!currentPassword}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal de detalles del usuario logueado (como en Team) */}
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
          {(() => {
            const user = getLoggedUserFullData();
            if (!user) return <div>No hay datos de usuario.</div>;
            return <>
              <Box mb={1}><b>ID:</b> {user.id || ""}</Box>
              <Box mb={1}><b>C.C:</b> {user.cedula || ""}</Box>
              <Box mb={1}><b>Primer Nombre:</b> {user.primerNombre || ""}</Box>
              <Box mb={1}><b>Segundo Nombre:</b> {user.segundoNombre || ""}</Box>
              <Box mb={1}><b>Apellido:</b> {user.apellido || ""}</Box>
              <Box mb={1}><b>Edad:</b> {user.age || ""}</Box>
              <Box mb={1}><b>Teléfono:</b> {user.phone || ""}</Box>
              <Box mb={1}><b>Email:</b> {user.email || ""}</Box>
              <Box mb={1}><b>Rol:</b> {user.access === "admin" ? "admin" : user.access === "manager" ? "manager" : "empleado"}</Box>
            </>;
          })()}
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
          <Button
            onClick={() => {
              setEditDialogOpen(true);
              setViewDialogOpen(false);
            }}
            variant="contained"
            sx={{
              backgroundColor: colors.greenAccent[600],
              color: colors.grey[900],
              '&:hover': { backgroundColor: colors.greenAccent[700] },
            }}
          >
            Editar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Topbar;
