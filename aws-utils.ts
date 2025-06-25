import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { awsConfig } from "./config";

export const uploadToS3 = async (
  s3Client: S3Client,
  buffer: Buffer,
  key: string,
  contentType: string = "image/jpeg"
) => {
  const uploadParams = {
    Bucket: awsConfig.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };

  const upload = new Upload({
    client: s3Client,
    params: uploadParams,
  });

  return upload.done();
};
