import { validationResult } from "express-validator";
import {
  getAllBedroomsService,
  getBedroomByIdService,
  createBedroomService,
  updateBedroomService,
  deleteBedroomService,
} from "../services/Bedrom_Service.js";
import { updateGroupedComfortsByBedroomService } from "../services/BedroomComfort_Service.js";

export const getAllBedroomsController = async (req, res) => {
  try {
    const bedrooms = await getAllBedroomsService();
    res.status(200).json(bedrooms);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getBedroomByIdController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const bedroom = await getBedroomByIdService(req.params.id);
    if (!bedroom) {
      return res.status(404).json({ message: "Habitación no encontrada" });
    }
    res.status(200).json(bedroom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createBedroomController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    // ¡AQUÍ FALTA MANEJAR LAS COMODIDADES!
    const { name, description, capacity, status, comforts } = req.body; // Asumimos que 'comforts' puede venir aquí

    const roomData = { name, description, capacity, status: status || "En Servicio" };
    const newRoom = await createBedroomService(roomData);

    // Si se enviaron comodidades, asignarlas
    if (comforts && Array.isArray(comforts) && comforts.length > 0) {
      await updateGroupedComfortsByBedroomService({ idRoom: newRoom.idRoom, comforts });
    }

    const cabinWithDetails = await getBedroomByIdService(newRoom.idRoom);
    res.status(201).json(cabinWithDetails);

  } catch (error) {
    console.error("Error en createBedroomController:", error);
    res.status(400).json({ message: error.message });
  }
};

export const updateBedroomController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { name, description, capacity, status, comforts } = req.body;

    // Obtener la habitación existente
    const existingRoom = await getBedroomByIdService(id);
    if (!existingRoom) {
      return res.status(404).json({ message: "Habitación no encontrada" });
    }

    const BedroomDataToUpdate = {
      name: name === undefined ? existingRoom.name : name,
      description: description === undefined ? existingRoom.description : description,
      capacity: capacity === undefined ? existingRoom.capacity : capacity,
      status: status === undefined ? existingRoom.status : status
    };
    await updateBedroomService(id, BedroomDataToUpdate);

    // Actualizar comodidades SI se proporcionaron en el body
    if (comforts !== undefined && Array.isArray(comforts)) {
      await updateGroupedComfortsByBedroomService({ idRoom: parseInt(id), comforts });
    }

    const updatedBedRoomWithDetails = await getBedroomByIdService(id);
    res.status(200).json(updatedBedRoomWithDetails);

  } catch (error) {
    console.error("Error en updateCabinController:", error);
    res.status(400).json({ message: error.message });
  }
};


export const deleteBedroomController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const idBedroom = req.params.id;
   

    await deleteBedroomService(idBedroom);
    res.status(200).json({ message: "Habitación eliminada correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};