import mongoose from "mongoose";

export const connectDB = async (uri) => {
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
};
