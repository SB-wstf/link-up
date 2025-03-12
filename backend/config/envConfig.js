import dotenv from "dotenv";
dotenv.config();

export const env = {
  db: process.env.MONGO_DB,

  LINKEDIN_EMAIL: process.env.LINKEDIN_EMAIL,
  LINKEDIN_PASSWORD: process.env.LINKEDIN_PASSWORD,
  LINKEDIN_PROFILE_URL: process.env.LINKEDIN_PROFILE_URL,
};
