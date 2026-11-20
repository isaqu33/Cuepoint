/* eslint-disable @typescript-eslint/no-unused-vars */
import process from 'process';
import {
  BlobServiceClient,
  BlockBlobClient,
  type BlobDeleteIfExistsResponse,
  type ContainerDeleteIfExistsResponse,
  type StoragePipelineOptions,
} from '@azure/storage-blob';
import type { Readable } from 'stream';
import { MinioAdapter } from './minio-adapter';

function getMinioBaseUrl(): string {
  const {
    MINIO_ENDPOINT,
    MINIO_PORT,
    MINIO_USE_SSL,
  } = process.env;

  if (process.env.MINIO_PUBLIC_URL) return process.env.MINIO_PUBLIC_URL.replace(/\/$/, '');

  const protocol = MINIO_USE_SSL?.toLowerCase() === 'true' ? 'https' : 'http';
  const endpoint = MINIO_ENDPOINT || '';
  const port = MINIO_PORT || '';
  
  return `${protocol}://${endpoint}${port ? `:${port}` : ''}`;
}

const MINIO_BASE_URL = getMinioBaseUrl();

interface CreateContainerIfNotExistsArgs {
  containerName: string;
}

interface CreateBlockBlobFromStreamArgs {
  containerName: string;
  blobName: string;
  stream: Readable;
  streamLength: number | undefined;
  callback?: () => void;
}

interface GetBlobUrlWithSASArgs {
  containerName: string;
  blobName: string;
}

interface GetBlobToStreamArgs {
  containerName: string;
  blobName: string;
  writeStream: typeof WritableStream;
  options: StoragePipelineOptions;
  callback: () => void;
}

interface DeleteContainerIfExistsArgs {
  containerName: string;
  options?: StoragePipelineOptions;
  callback?: () => void;
}

interface DeleteBlobIfExistsArgs {
  containerName: string;
  blobName: string;
  options?: undefined;
  callback?: () => void;
}

interface BlobStorageDeps {
  BlobServiceClient?: typeof BlobServiceClient;
  minioAdapter?: MinioAdapter;
}

export default function blobStorage(_args = {}, deps: BlobStorageDeps = {}) {
  const minioAdapter = deps.minioAdapter || new MinioAdapter();

  const createContainerIfNotExists = async (
    args: CreateContainerIfNotExistsArgs,
    deps = {},
  ): Promise<boolean> => {
    await minioAdapter.ensureBucketExists(args.containerName);
    return true;
  };

  const configureCors = async () => {
    await minioAdapter.configureCors();
  };

  configureCors();

  const createBlockBlobFromStream = async (
    args: CreateBlockBlobFromStreamArgs,
    deps = {},
  ): Promise<BlockBlobClient> => {
    await minioAdapter.uploadStream(
      args.containerName,
      args.blobName,
      args.stream,
      args.streamLength
    );

    return {
      url: `${MINIO_BASE_URL}/${args.containerName}/${args.blobName}`
    } as unknown as BlockBlobClient;
  };

  const getBlobUrlWithSAS = (args: GetBlobUrlWithSASArgs): string => {
    return minioAdapter.getFormattedUrl(args.containerName, args.blobName);
  };

  const deleteContainerIfExists = async (
    args: DeleteContainerIfExistsArgs,
  ): Promise<ContainerDeleteIfExistsResponse> => {
    await minioAdapter.deleteBucket(args.containerName);
    return { succeeded: true, _response: { status: 200 } } as unknown as ContainerDeleteIfExistsResponse;
  };

  const deleteBlobIfExists = async (
    args: DeleteBlobIfExistsArgs,
  ): Promise<BlobDeleteIfExistsResponse> => {
    await minioAdapter.deleteObject(args.containerName, args.blobName);
    return { succeeded: true, _response: { status: 200 } } as unknown as BlobDeleteIfExistsResponse;
  };

  return {
    deleteBlobIfExists,
    deleteContainerIfExists,
    createBlockBlobFromStream,
    getBlobUrlWithSAS,
    createContainerIfNotExists,
    blobServiceClient: { url: MINIO_BASE_URL }, 
  };
}
