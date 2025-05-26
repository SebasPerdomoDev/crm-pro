import React, { useState } from "react";
import FullCalendar, { formatDate } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import esLocale from "@fullcalendar/core/locales/es"; // Importa el idioma español
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { v4 as uuidv4 } from "uuid";

const Calendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [events, setEvents] = useState(() => {
    const stored = localStorage.getItem("calendarEvents");
    return stored ? JSON.parse(stored) : [];
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
  });
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState([]);

  // Guardar eventos en localStorage cada vez que cambian
  React.useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  // Mostrar eventos en el sidebar
  const currentEvents = events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    start: ev.date,
  }));

  // Crear evento
  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    setEvents([
      ...events,
      {
        id: uuidv4(),
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
      },
    ]);
    setCreateDialogOpen(false);
    setNewEvent({ title: "", description: "", date: "" });
  };

  // Al hacer click en una fecha, mostrar eventos de ese día
  const handleDateClick = (info) => {
    const dateStr = info.dateStr;
    const dayEvents = events.filter((ev) => ev.date === dateStr);
    setSelectedDateEvents(dayEvents);
    setViewDialogOpen(true);
  };

  // Eliminar evento
  const handleDeleteEvent = (id) => {
    setEvents(events.filter((ev) => ev.id !== id));
  };

  return (
    <Box m="20px">
      <Header title="CALENDARIO EVENTOS" />
      <Box display="flex" justifyContent="space-between">
        {/* CALENDAR SIDEBAR */}
        <Box
          flex="1 1 20%"
          backgroundColor={colors.primary[400]}
          p="15px"
          borderRadius="4px"
        >
          <Typography variant="h5">Eventos</Typography>
          <Button
            variant="contained"
            sx={{
              backgroundColor: colors.greenAccent[600],
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "30px",
              px: 2,
              py: 1,
              my: 2,
              textTransform: "none",
              fontSize: "1rem",
              width: "100%",
              "&:hover": { backgroundColor: colors.greenAccent[700] },
            }}
            onClick={() => setCreateDialogOpen(true)}
          >
            Crear evento
          </Button>
          <List>
            {currentEvents.map((event) => (
              <ListItem
                key={event.id}
                sx={{
                  backgroundColor: colors.greenAccent[500],
                  margin: "10px 0",
                  borderRadius: "2px",
                }}
              >
                <ListItemText
                  primary={event.title}
                  secondary={
                    <Typography>
                      {formatDate(event.start, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
        {/* CALENDAR */}
        <Box flex="1 1 100%" ml="15px">
          <FullCalendar
            height="75vh"
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
            }}
            initialView="dayGridMonth"
            editable={false}
            selectable={false}
            dayMaxEvents={true}
            events={events.map((ev) => ({
              id: ev.id,
              title: ev.title,
              start: ev.date,
              allDay: true,
            }))}
            dateClick={handleDateClick}
            locale={esLocale}
          />
          {/* Modal para crear evento */}
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
              Crear Evento
            </DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                label="Título"
                name="title"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
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
                name="description"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                fullWidth
                multiline
                minRows={2}
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
                label="Fecha"
                name="date"
                type="date"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
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
                  "&:hover": { backgroundColor: colors.redAccent[700] },
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateEvent}
                variant="contained"
                sx={{
                  backgroundColor: colors.greenAccent[600],
                  color: colors.grey[900],
                  "&:hover": { backgroundColor: colors.greenAccent[700] },
                }}
              >
                Crear
              </Button>
            </DialogActions>
          </Dialog>
          {/* Modal para ver eventos de una fecha */}
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
            <DialogTitle sx={{ color: colors.greenAccent[400] }}>
              Eventos del día
            </DialogTitle>
            <DialogContent>
              {selectedDateEvents.length === 0 ? (
                <Typography>No hay eventos para esta fecha.</Typography>
              ) : (
                selectedDateEvents.map((ev) => (
                  <Box
                    key={ev.id}
                    mb={2}
                    p={2}
                    borderRadius={2}
                    bgcolor={colors.primary[400]}
                    display="flex"
                    alignItems="center"
                  >
                    <input
                      type="checkbox"
                      checked={selectedToDelete.includes(ev.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedToDelete([...selectedToDelete, ev.id]);
                        } else {
                          setSelectedToDelete(
                            selectedToDelete.filter((id) => id !== ev.id)
                          );
                        }
                      }}
                      style={{ marginRight: 12 }}
                    />
                    <Box flex={1}>
                      <Typography variant="h6" color={colors.greenAccent[300]}>
                        {ev.title}
                      </Typography>
                      <Typography variant="body2" color={colors.grey[200]}>
                        {ev.description}
                      </Typography>
                      <Typography variant="caption" color={colors.grey[400]}>
                        {ev.date}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setViewDialogOpen(false)}
                sx={{
                  color: colors.grey[100],
                  backgroundColor: colors.blueAccent[600],
                  "&:hover": { backgroundColor: colors.blueAccent[700] },
                }}
              >
                Cerrar
              </Button>
              {selectedDateEvents.length > 0 && (
                <Button
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={selectedToDelete.length === 0}
                  sx={{
                    color: colors.grey[100],
                    backgroundColor: colors.redAccent[600],
                    "&:hover": { backgroundColor: colors.redAccent[700] },
                  }}
                >
                  Eliminar
                </Button>
              )}
            </DialogActions>
          </Dialog>
          {/* Modal de confirmación de eliminación */}
          <Dialog
            open={confirmDeleteOpen}
            onClose={() => setConfirmDeleteOpen(false)}
            PaperProps={{
              sx: {
                backgroundColor: colors.primary[500],
                color: colors.grey[100],
                borderRadius: 3,
                minWidth: 350,
              },
            }}
          >
            <DialogTitle sx={{ color: colors.redAccent[400] }}>
              Confirmar eliminación
            </DialogTitle>
            <DialogContent>
              <Typography>
                ¿Estás seguro de que deseas eliminar los eventos seleccionados?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setConfirmDeleteOpen(false)}
                sx={{
                  color: colors.grey[100],
                  backgroundColor: colors.blueAccent[600],
                  "&:hover": { backgroundColor: colors.blueAccent[700] },
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  selectedToDelete.forEach((evId) => handleDeleteEvent(evId));
                  setConfirmDeleteOpen(false);
                  setViewDialogOpen(false);
                  setSelectedToDelete([]);
                }}
                sx={{
                  color: colors.grey[100],
                  backgroundColor: colors.redAccent[600],
                  "&:hover": { backgroundColor: colors.redAccent[700] },
                }}
                variant="contained"
              >
                Eliminar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
};

export default Calendar;