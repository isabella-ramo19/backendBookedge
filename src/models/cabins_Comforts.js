import { DataTypes } from "sequelize";
import { database } from "../config/Database.js";

export const CabinsComforts = database.define(
  "CabinsComforts",
  {
    idCabinComfort: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    idCabin: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    idComfort: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description : {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    dateEntry: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "CabinsComforts", 
    timestamps: false,
  }
);