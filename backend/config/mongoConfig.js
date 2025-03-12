import mongoose from "mongoose";
import { env } from "./envConfig.js";

const connectDB = async () => {
  try {
    const connDB = await mongoose.connect(`${env.db}/autoUpdator`);

    // console.log(`Mongo DB Connected Successfully: ${connDB.connection.host}`);
    console.log(`Mongo DB Connected Successfully.`.cyan);
  } catch (err) {
    console.log(`Mongo Connection Error ${err}`.red);
    process.exit();
  }
};

export default connectDB;
