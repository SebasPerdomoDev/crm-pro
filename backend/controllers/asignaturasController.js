const db = require("../config/db");
const Asignatura = require("../models/asignaturas");

module.exports = {
  // Crear una asignatura
  async createAsignatura  (req, res) {
    const asignaturaData = req.body;
  
    if (!asignaturaData.nombre) {
      return res.status(400).json({ success: false, message: "El nombre de la asignatura es obligatorio." });
    }
  
    Asignatura.createAsignatura(asignaturaData, (err, data) => {
      if (err) {
        return res.status(400).json({ success: false, message: "Error al crear la asignatura.", error: err });
      }
      res.status(201).json({ success: true, message: "Asignatura creada correctamente.", data });
    });
  },
  
  // Actualizar una asignatura
  async updateAsignatura  (req, res) {
    const { asignaturaId } = req.params;
    const updatedData = req.body;
  
    Asignatura.updateAsignatura(asignaturaId, updatedData, (err, data) => {
      if (err) {
        return res.status(400).json({ success: false, message: "Error al actualizar la asignatura.", error: err });
      }
      res.status(200).json({ success: true, message: "Asignatura actualizada correctamente." });
    });
  },
  
  // Eliminar una asignatura
  async deleteAsignatura  (req, res) {
    const { asignaturaId } = req.params;
  
    Asignatura.deleteAsignatura(asignaturaId, (err, data) => {
      if (err) {
        return res.status(400).json({ success: false, message: "Error al eliminar la asignatura.", error: err });
      }
      res.status(200).json({ success: true, message: "Asignatura eliminada correctamente." });
    });
  },
};