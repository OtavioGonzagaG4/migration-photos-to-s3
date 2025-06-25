export const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE!,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
  },
};

export const awsConfig = {
  region: process.env.AWS_REGION!,
  bucket: process.env.AWS_BUCKET!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

export const filePath = process.env.USERS_FILE_PATH!;
export const errorFilePath = process.env.ERROR_USERS_FILE_PATH!;

export const filePathCoachAttachmentFile =
  process.env.COACH_ATTACHMENT_FILE_PATH!;
export const errorFilePathCoachAttachmentFile =
  process.env.ERROR_COACH_ATTACHMENT_FILE_PATH!;

export const envTest = process.env.ENV_TEST === "true";
