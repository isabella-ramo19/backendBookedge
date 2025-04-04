import express, { json } from 'express';
import { database } from './src/config/database.js';
import morgan from "morgan";
import cookieParser from 'cookie-parser';
import cabinRoutes from './src/routes/Cabin_Routes.js';
import comfortRoutes from './src/routes/Comfort_Routes.js';
// import customerRoutes from './src/routes/Customers_Routes.js';
import serviceRoutes from './src/routes/Service_Route.js';
import permissionRoutes from './src/routes/Permission_Route.js';
import rolesRoutes from './src/routes/Roles_Routes.js';
import { setupAssociations } from './src/models/setupAssociations.js';
import companionsRoutes from './src/routes/Companions_Routes.js';
import  reservationsRoutes from './src/routes/Reservations_Routes.js';
import userRoutes from './src/routes/User_Routes.js';
import bedromRoutes from './src/routes/Bedrom_Routes.js'
import planRoutes from './src/routes/Plan_Routes.js'
import planProgramed from './src/routes/Plan_Programed_Routes.js'
import PaymentsRoutes from './src/routes/Payments_Rutes.js';
import authRoutes from './src/routes/authRoutes.js'


export default class Server {

    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(cookieParser());
        this.app.use(morgan('dev'));
        this.dbConection();
        this.listen();
        this.routes();
        this.setupAssociations();
    }

    setupAssociations() {
        try {
            setupAssociations();
        } catch (error) {
            console.error('Error al configurar las asociaciones', error);
        }
    }

    async dbConection() {
        try {
            await database.authenticate();
            console.log('Base de datos conectada');
        } catch (error) {
            console.error('Se jodió la base de datos', error);
        }
    }

    routes() {
        this.app.use('/user',userRoutes);
        this.app.use('/cabins', cabinRoutes);
        this.app.use('/comforts', comfortRoutes);
        // this.app.use('/customers', customerRoutes);
        this.app.use('/services', serviceRoutes);
        this.app.use('/companions', companionsRoutes);
        this.app.use('/reservations', reservationsRoutes);
        this.app.use('/permissions', permissionRoutes);
        this.app.use('/roles', rolesRoutes);
        this.app.use('/bedroom',bedromRoutes)
        this.app.use('/plan',planRoutes)
        this.app.use('/planProgramed',planProgramed)
        this.app.use('/payments',PaymentsRoutes)
        this.app.use('/auth',authRoutes)
    }

    listen() {
        this.app.listen(process.env.PORT, () => {
            console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
        })
    }
} 