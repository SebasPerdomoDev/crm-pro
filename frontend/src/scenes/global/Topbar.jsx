import { Box, IconButton, useTheme } from "@mui/material";
import { useContext, useState } from "react";
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

  const handleEditChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (e) => {
    setUserData({ ...userData, rol: e.target.value });
  };

  const handleEditSave = () => {
    // Aquí deberías validar la contraseña actual antes de guardar cambios
    // Por ejemplo, comparar currentPassword con la contraseña real del usuario
    // Si es válida, guardar cambios; si no, mostrar error.
    setEditDialogOpen(false);
    setCurrentPassword("");
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
        <IconButton onClick={() => setEditDialogOpen(true)}>
          <PersonOutlinedIcon />
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
            placeholder="Nombre"
            name="nombre"
            value={userData.nombre}
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
    </Box>
  );
};

export default Topbar;
