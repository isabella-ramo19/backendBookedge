import { DataTypes } from 'sequelize';
import { database } from '../config/database.js';

export const Roles = database.define('roles',
    {
        idRol: {
            require: true,
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }

    },
    {
        tableName: 'roles',
    }

)
