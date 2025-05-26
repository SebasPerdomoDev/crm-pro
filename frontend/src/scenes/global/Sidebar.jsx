import { useState, useEffect } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PieChartOutlineOutlinedIcon from "@mui/icons-material/PieChartOutlineOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import LogoutIcon from "@mui/icons-material/Logout";

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <MenuItem
      active={selected === title}
      style={{
        color: colors.grey[100],
      }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Typography>{title}</Typography>
      <Link to={to} />
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  const navigate = useNavigate();

  // Leer usuario logueado de localStorage
  const [loggedUser, setLoggedUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) {
      setLoggedUser(JSON.parse(storedUser));
    }
  }, []);

  const userName = loggedUser
  ? `${loggedUser.primerNombre || ""} ${loggedUser.apellido || ""}`.trim()
  : "Juan Perdomo";



  const handleLogout = () => {
    localStorage.removeItem("loggedUser");
    navigate("/");
  };

  return (
    <Box
      sx={{
        height: "100vh",
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "5px 35px 5px 20px !important",
          fontSize: "1.0rem",
        },
        "& .pro-inner-item:hover": {
          color: "#868dfb !important",
        },
        "& .pro-menu-item.active": {
          color: "#6870fa !important",
        },
        "& .MuiTypography-root": {
          fontSize: "1.0rem",
        },
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
          <Menu iconShape="square">
            <MenuItem
              onClick={() => setIsCollapsed(!isCollapsed)}
              icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
              style={{
                margin: "10px 0 20px 0",
                color: colors.grey[100],
              }}
            >
              {!isCollapsed && (
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  ml="15px"
                >
                  <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                    <MenuOutlinedIcon />
                  </IconButton>
                </Box>
              )}
            </MenuItem>

            {!isCollapsed && (
              <Box mb="25px">
                <Box display="flex" justifyContent="center" alignItems="center">
                  <img
                    alt="profile-user"
                    width="100px"
                    height="100px"
                    src={`../../assets/user.png`}
                    style={{ cursor: "pointer", borderRadius: "50%" }}
                  />
                </Box>
                <Box textAlign="center">
                  <Typography
                    variant="h2"
                    color={colors.grey[100]}
                    fontWeight="bold"
                    sx={{ m: "10px 0 0 0" }}
                  >
                    {userName}
                  </Typography>
                  
                </Box>
              </Box>
            )}

            <Box paddingLeft={isCollapsed ? undefined : "10%"}>
              <Item
                title="Dashboard"
                to="/dashboard"
                icon={<HomeOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Data
              </Typography>
              <Item
                title="Team"
                to="/team"
                icon={<PeopleOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Clientes Potenciales"
                to="/contacts"
                icon={<ContactsOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Productos"
                to="/invoices"
                icon={<ReceiptOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Calendario"
                to="/calendar"
                icon={<CalendarTodayOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Charts
              </Typography>
              <Item
                title="Bar Chart"
                to="/bar"
                icon={<BarChartOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Pie Chart"
                to="/pie"
                icon={<PieChartOutlineOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Line Chart"
                to="/line"
                icon={<TimelineOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </Box>
          </Menu>
        </Box>

        {/* Botón de cerrar sesión */}
        <Box
          sx={{
            padding: { xs: "8px 8px", md: "12px 20px" },
            borderTop: `1px solid ${colors.grey[700]}`,
            display: "flex",
            justifyContent: "center",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Box
            onClick={handleLogout}
            sx={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 1,
              background: "linear-gradient(90deg, #4cceac 0%, #6870fa 100%)",
              color: "white",
              px: isCollapsed ? 1.5 : 3,
              py: isCollapsed ? 1 : 1.5,
              borderRadius: "30px",
              fontWeight: "bold",
              boxShadow: "0px 4px 15px rgba(5, 5, 5, 0.6)",
              transition: "background 0.3s ease",
              "&:hover": {
                background: "linear-gradient(90deg, #6870fa 0%, #4cceac 100%)",
              },
              userSelect: "none",
              fontSize: "1rem",
              width: isCollapsed ? "auto" : "100%",
              justifyContent: "center",
            }}
          >
            <LogoutIcon sx={{ fontSize: 22 }} />
            {!isCollapsed && (
              <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                Cerrar Sesión
              </span>
            )}
          </Box>
        </Box>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;
