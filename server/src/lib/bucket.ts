import { S3Client } from "@aws-sdk/client-s3";

const required = (k: string) => {
	const v = process.env[k];
	if (!v) throw new Error(`${k} is required (MinIO local mode)`);
	return v;
};

export const s3 = new S3Client({
	region: required("BUCKET_REGION"),
	endpoint: required("BUCKET_ENDPOINT"),
	forcePathStyle: true,
	credentials: {
		accessKeyId: required("BUCKET_ACCESS_KEY"),
		secretAccessKey: required("BUCKET_SECRET_KEY"),
	},
});

export const BUCKET_NAME = required("BUCKET_NAME");
