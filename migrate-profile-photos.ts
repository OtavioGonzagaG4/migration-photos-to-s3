import { S3Client } from "@aws-sdk/client-s3";
import sql from "mssql";
import { uploadToS3 } from "./aws-utils";
import {
  awsConfig,
  config,
  envTest,
  errorFilePathCoachAttachmentFile,
  filePathCoachAttachmentFile,
} from "./config";
import { formatLogs } from "./utils";

enum FilePathProfilePhoto {
  CONSULTANTS = "consultants-photos",
  CUSTOMERS = "customers-photos",
  GUESTS = "guests-photos",
}

const file = Bun.file(filePathCoachAttachmentFile);
const fileError = Bun.file(errorFilePathCoachAttachmentFile);
const writer = file.writer();
const writerError = fileError.writer();

const pool = await sql.connect(config);

const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
  },
});

type ConsultantPicture = {
  consultantId: string;
  contentType: string;
  imageData: any;
};

type CustomerPicture = {
  customerId: string;
  contentType: string;
  imageData: any;
};

async function migratePhotosConsultant() {
  console.log("Iniciando migração de fotos do consultor");
  let consultantPhotosMigrated = 0;

  const timeStart = new Date().getTime();

  const result = await pool
    .request()
    .query<ConsultantPicture>("SELECT * FROM [dbo].[ConsultantPicture]");

  console.log(
    "Total de fotos do consultor encontradas: ",
    result.recordset.length
  );

  for await (const {
    consultantId,
    contentType,
    imageData,
  } of result.recordset) {
    try {
      const s3Key = `${FilePathProfilePhoto.CONSULTANTS}/${consultantId}.jpg`;
      if (!envTest) {
        const { Location: pictureUrl } = await uploadToS3(
          s3Client,
          imageData,
          s3Key,
          contentType
        );
        await pool.request()
          .query`UPDATE [dbo].[Consultant] SET [profilePhotoUrl] = ${pictureUrl} WHERE [id] = ${consultantId}`;
        writer.write(`consultorId:${consultantId},${pictureUrl}\n`);
      } else {
        writer.write(`consultorId:${consultantId},FAKE${s3Key}\n`);
      }
      consultantPhotosMigrated++;
    } catch (error) {
      const errorLog = formatLogs(
        consultantId,
        "Erro ao migrar foto do consultor",
        error
      );
      writerError.write(errorLog);
    }
  }

  const timeEnd = new Date().getTime();
  console.log("Tempo de execução: ", (timeEnd - timeStart) / 1000, " segundos");
  console.log("Total de fotos migradas: ", consultantPhotosMigrated);
}

async function migratePhotosCustomer() {
  console.log("Iniciando migração de fotos do cliente");
  let customerPhotosMigrated = 0;

  const timeStart = new Date().getTime();

  const result = await pool
    .request()
    .query<CustomerPicture>("SELECT * FROM [dbo].[CustomerPicture]");

  console.log(
    "Total de fotos de clientes encontradas: ",
    result.recordset.length
  );

  for await (const { customerId, contentType, imageData } of result.recordset) {
    try {
      const s3Key = `${FilePathProfilePhoto.CUSTOMERS}/${customerId}.jpg`;
      if (!envTest) {
        const { Location: pictureUrl } = await uploadToS3(
          s3Client,
          imageData,
          s3Key,
          contentType
        );
        writer.write(`customerId:${customerId},${pictureUrl}\n`);
        await pool.request()
          .query`UPDATE [dbo].[Customer] SET [profilePhotoUrl] = ${pictureUrl} WHERE [id] = ${customerId}`;
      } else {
        writer.write(`customerId:${customerId},FAKE${s3Key}\n`);
      }
      customerPhotosMigrated++;
    } catch (error) {
      const errorLog = formatLogs(
        customerId,
        "Erro ao migrar foto do cliente",
        error
      );
      writerError.write(errorLog);
    }
  }

  const timeEnd = new Date().getTime();
  console.log("Tempo de execução: ", (timeEnd - timeStart) / 1000, " segundos");
  console.log("Total de fotos migradas: ", customerPhotosMigrated);
}

await migratePhotosConsultant();
await migratePhotosCustomer();
writer.end();
writerError.end();
process.exit(0);
