import { validationResult } from "express-validator"
import { Payments } from "../models/Payments_Model.js"
import { Cabins } from "../models/cabin_Model.js"
import { Reservations } from "../models/Reservations_Model.js"
import { PaymentsReservations } from "../models/Payments_Reservations_model.js"
import { ReservationsCabins } from "../models/Reservations_cabins_Model.js"
import {
  getAllReservationsService,
  getReservationsByIdService,
  createReservationsService,
  addCompanionsServices,
  addPlansServices,
  updateCompanionsService,
  deleteCompanionsService,
  changeStatusReservationsService,
  addCabinService,
  addBedroomsService,
  addServiceService,
} from "../services/Reservations_Services.js"
import { json } from "sequelize"

export const getAllReservationsController = async (req, res) => {
  try {
    const reservations = await getAllReservationsService()

    console.log("Reservas enviadas al cliente:", reservations)
    console.log("Datos obtenidos de Sequelize:", JSON.stringify(reservations, null, 2))
    res.status(200).json(reservations)
  } catch (error) {
    console.error("Error al obtener reservas:", error.message)
    res.status(500).json({ error: error.message })
  }
}

export const getReservationsByIdController = async (req, res) => {
  const errors = validationResult(req)
  try {
    console.log("ID recibido en el controlador:", req.params.idReservation)
    const reservation = await getReservationsByIdService(req.params.idReservation)
    if (!reservation) {
      return res.status(404).json({ message: "Reserva no encontrada" })
    }
    res.status(200).json(reservation)
  } catch (error) {
    console.error("Error en el controlador:", error.message)
    res.status(400).json({ message: error.message })
  }
}

export const createReservationsController = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    const { idCabin, ...reservationData } = req.body

    // Crear la reserva sin la cabaña primero
    const reservation = await createReservationsService(reservationData)

    // Si se proporcionó un idCabin, asociar la cabaña a la reserva
    if (idCabin) {
      const cabinExists = await Cabins.findByPk(idCabin)
      if (!cabinExists) {
        return res.status(400).json({ error: "La cabaña especificada no existe" })
      }

      // Crear la asociación en la tabla intermedia
      await ReservationsCabins.create({
        idReservation: reservation.idReservation,
        idCabin: idCabin,
      })

      // Obtener la reserva con sus cabañas
      const updatedReservation = await Reservations.findByPk(reservation.idReservation, {
        include: [
          {
            model: Cabins,
            as: "cabins",
            through: { attributes: [] }, // No incluir atributos de la tabla intermedia
          },
        ],
      })

      return res.status(201).json(updatedReservation)
    }

    res.status(201).json(reservation)
  } catch (error) {
    console.error("Error en createReservationsController:", error)
    res.status(400).json({ message: error.message })
  }
}

export const updateReservationsController = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { idReservation } = req.params
    const { idCabin, ...reservationData } = req.body

    // Verificar que la reserva existe antes de actualizar
    const existingReservation = await Reservations.findByPk(idReservation)
    if (!existingReservation) {
      return res.status(404).json({
        error: `Reserva con ID ${idReservation} no encontrada`,
        suggestion: "Verifique el ID o cree una nueva reserva",
      })
    }

    // Actualizar los campos básicos
    await existingReservation.update(reservationData)

    // Actualizar cabaña si se proporcionó
    if (idCabin) {
      const cabinExists = await Cabins.findByPk(idCabin)
      if (!cabinExists) {
        return res.status(400).json({ error: "La cabaña especificada no existe" })
      }

      // Eliminar asociaciones existentes
      await ReservationsCabins.destroy({
        where: { idReservation },
      })

      // Crear nueva asociación
      await ReservationsCabins.create({
        idReservation,
        idCabin,
      })
    }

    // Obtener la reserva actualizada con sus cabañas
    const updatedReservation = await Reservations.findByPk(idReservation, {
      include: [
        {
          model: Cabins,
          as: "cabins",
          through: { attributes: [] }, // No incluir atributos de la tabla intermedia
        },
      ],
    })

    res.status(200).json(updatedReservation)
  } catch (error) {
    console.error("Error en updateReservationsController:", error)
    res.status(500).json({
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

export const changeStatusReservationsController = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    await changeStatusReservationsService(req.params.id, req.body.status)
    res.status(200).end()
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const getAllReservationsCompanions = async (req, res) => {
  try {
    const companionsData = await getAllReservationsCompanions()
    res.status(200).json(companionsData)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const addCompanions = async (req, res) => {
  try {
    const { idReservation } = req.params
    const { idCompanions } = req.body

    console.log("Datos recibidos:", { idReservation, idCompanions })

    if (!idCompanions) {
      return res.status(400).json({ message: "Falta el ID del acompañante" })
    }

    // Validar que sean números
    const reservationId = Number(idReservation)
    const companionId = Number(idCompanions)

    if (isNaN(reservationId)) {
      return res.status(400).json({ message: "ID de reserva inválido" })
    }

    if (isNaN(companionId)) {
      return res.status(400).json({ message: "ID de acompañante inválido" })
    }

    await addCompanionsServices(reservationId, companionId)
    res.status(200).json({
      message: "Acompañante agregado exitosamente",
      idReservation: reservationId,
      idCompanions: companionId,
    })
  } catch (error) {
    console.error("Error detallado:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    })

    res.status(400).json({
      message: error.message,
      details: error.response?.data || error.stack,
    })
  }
}
export const addPaymentToReservationController = async (req, res) => {
  try {
    console.log("Datos recibidos en el backend:", req.body)

    const { idReservation } = req.params
    const { paymentMethod, amount, paymentDate, status } = req.body

    // Validación mejorada
    if (!paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos",
        required: ["paymentMethod", "amount"],
        received: req.body,
      })
    }

    // Crear el pago
    const payment = await Payments.create({
      paymentMethod,
      amount: Number.parseFloat(amount),
      paymentDate: paymentDate || new Date(),
      status: status || "Pendiente",
    })
    console.log("Pago creado:", payment)
    console.log("ID del pago creado:", payment.idPayments)

    // Asociar a la reserva
    await PaymentsReservations.create({
      idReservation,
      idPayments: payment.idPayments,
      amountApplied: payment.amount,
    })

    res.status(201).json({
      success: true,
      message: "Pago agregado correctamente",
      payment,
    })
  } catch (error) {
    console.error("Error en el controlador de pagos:", error)
    res.status(400).json({
      success: false,
      message: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    })
  }
}

export const addPlans = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    const { idReservation, idPlan } = req.body
    console.log("Datos recibidos en el controlador:", {
      idReservation,
      idPlan,
    })
    await addPlansServices(idReservation, idPlan)
    res.status(200).json({ message: "Plan Agregado exitosamente" })
  } catch (error) {
    console.error("Error al agregar el plan: ", error)
    res.status(400), json({ message: error.message })
  }
}

export const addCabin = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    const { idReservation, idCabin } = req.body
    console.log("Datos de la cabaña:", { idReservation, idCabin })
    await addCabinService(idReservation, idCabin)
    res.status(200).json({ message: "Cabañas agregadas exitosamente" })
  } catch (error) {
    console.error("Error al agregar la cabaña:", error)
    res.status(400).json({ message: error.message })
  }
}

export const addBedrooms = async (res, req) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    const { idReservation, idRoom } = req.body
    console.log("Datos de la habitación:", { idReservation, idRoom })
    await addBedroomsService(idReservation, idRoom)
    res.status(200).json({ message: "Habitaciones agregadas exitosamente" })
  } catch (error) {
    console.error("Error al agregar la habitación:", error)
    res.status(400).json({ message: error.message })
  }
}

export const addService = async (res, req) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    const { idReservation, idService } = req.body
    console.log("Datos del servicio:", { idReservation, idService })
    await addServiceService(idReservation, idService)
    res.status(200).json({ message: "Servicios agregados exitosamente" })
  } catch (error) {
    console.error("Error al agregar el servicio:", error)
    res.status(400).json({ message: error.message })
  }
}

export const updateCompanion = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    const { idReservationsCompanions } = req.params
    await updateCompanionsService(idReservationsCompanions)
    res.status(200).json({ message: "Acompañante actualizado exitosamente" })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const deleteCompanions = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    const { idReservationsCompanions } = req.params
    await deleteCompanionsService(idReservationsCompanions)
    res.status(200).json({ message: "Acompañante eliminado exitosamente" })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
