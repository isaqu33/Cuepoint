import { Readable } from 'node:stream';
import { MinioAdapter } from './minio-adapter';

let minio: MinioAdapter | undefined;
/** Instancia o cliente só no primeiro uso (o build não exige variáveis de ambiente). */
const client = () => (minio ??= new MinioAdapter());

/**
 * Armazenamento de objetos (MinIO/S3) por "container" (bucket).
 * Substitui o antigo adaptador Azure/Azurite mantendo a mesma interface.
 */
export class ObjectStorageAdapter {
  constructor(private readonly containerName: string) {}

  async uploadFile(fileBuffer: Buffer, blobName: string): Promise<string> {
    await client().uploadStream(
      this.containerName,
      blobName,
      Readable.from(fileBuffer),
      fileBuffer.length,
    );
    return this.getBlobUrlWithSAS(blobName);
  }

  /** URL pública de leitura (o bucket tem política de leitura anônima). */
  async getBlobUrlWithSAS(blobName: string): Promise<string> {
    return client().getFormattedUrl(this.containerName, blobName);
  }

  presignPut(blobName: string, expirySeconds: number): Promise<string> {
    return client().presignPut(this.containerName, blobName, expirySeconds);
  }

  async statObject(blobName: string): Promise<{ size: number; contentType: string } | null> {
    try {
      const st = await client().statObject(this.containerName, blobName);
      return { size: st.size, contentType: String(st.metaData?.['content-type'] ?? '') };
    } catch {
      return null;
    }
  }

  initMultipart(blobName: string, contentType: string) {
    return client().initMultipart(this.containerName, blobName, contentType);
  }
  presignPart(blobName: string, uploadId: string, partNumber: number, expirySeconds: number) {
    return client().presignPart(this.containerName, blobName, uploadId, partNumber, expirySeconds);
  }
  completeMultipart(blobName: string, uploadId: string, parts: { part: number; etag: string }[]) {
    return client().completeMultipart(this.containerName, blobName, uploadId, parts);
  }
  abortMultipart(blobName: string, uploadId: string) {
    return client().abortMultipart(this.containerName, blobName, uploadId);
  }

  list() {
    return client().listAll(this.containerName);
  }

  async deleteBlobIfExists(blobName: string): Promise<{ succeeded: boolean }> {
    await client().deleteObject(this.containerName, blobName);
    return { succeeded: true };
  }
}
