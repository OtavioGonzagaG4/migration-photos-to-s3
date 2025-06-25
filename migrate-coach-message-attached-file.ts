import { S3Client } from "@aws-sdk/client-s3";
import sql from "mssql";
import {
  awsConfig,
  config,
  envTest,
  errorFilePathCoachAttachmentFile,
  filePathCoachAttachmentFile,
} from "./config";
import { uploadToS3 } from "./aws-utils";
import { formatLogs } from "./utils";

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

type CoachMessageAttachedFile = {
  id: string;
  fileName: string;
  date: Date;
  data: Buffer;
  contentType: string;
  contentLength: number;
  coachTopicId: string;
  coachMessageId: string;
  attachmentUrl: string;
};

async function migrateCoachMessageAttachedFile() {
  console.log("Iniciando migração dos anexos de mensagens de coach");
  let filesMigrated = 0;

  const timeStart = new Date().getTime();

  const result = await pool
    .request()
    .query<CoachMessageAttachedFile>(
      "SELECT x.* FROM [dbo].[CoachMessageAttachedFile] x WHERE [data] != ''"
    );

  console.log("Total de anexos encontradas: ", result.recordset.length);

  for await (const { id, contentType, data } of result.recordset) {
    try {
      const s3Key = `coach-message-attached-file/${id}.jpg`;
      if (!envTest) {
        const { Location: pictureUrl } = await uploadToS3(
          s3Client,
          data,
          s3Key,
          contentType
        );
        writer.write(`id:${id},${pictureUrl}\n`);
        await pool.request()
          .query`UPDATE [dbo].[CoachMessageAttachedFile] SET [attachmentUrl] = ${pictureUrl} WHERE [id] = ${id}`;
      } else {
        writer.write(`id:${id},FAKE${s3Key}\n`);
      }
      filesMigrated++;
    } catch (error) {
      const errorLog = formatLogs(
        id,
        "Erro ao migrar anexo de mensagem de coach",
        error
      );
      writerError.write(errorLog);
    }
  }

  const timeEnd = new Date().getTime();
  console.log("Tempo de execução: ", (timeEnd - timeStart) / 1000, " segundos");
  console.log("Total de anexos migradas: ", filesMigrated);
}

await migrateCoachMessageAttachedFile();
writer.end();
writerError.end();
process.exit(0);
