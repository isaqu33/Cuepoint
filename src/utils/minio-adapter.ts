import { Client, type BucketItem } from 'minio';
import process from 'process';
import type { Readable } from 'stream';
import { extractFilenameFromUrl } from '../lib/utils/url-formatter';

export class MinioAdapter {
  private client: Client;
  /** Cliente só para ASSINAR URLs com o endereço que o navegador enxerga (a assinatura inclui o host). */
  private signer: Client;
  private minioBaseUrl: string;

  constructor() {
    const {
      MINIO_ENDPOINT,
      MINIO_PORT,
      MINIO_ACCESS_KEY,
      MINIO_SECRET_KEY,
      MINIO_USE_SSL,
    } = process.env;

    if (!MINIO_ENDPOINT || !MINIO_PORT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
      throw new Error('MinIO configuration incomplete. Check your .env file.');
    }

    // URL que o NAVEGADOR usa para chegar ao storage (em Docker difere do endpoint interno).
    this.minioBaseUrl = (
      process.env.MINIO_PUBLIC_URL ||
      `${MINIO_USE_SSL?.toLowerCase() === 'true' ? 'https' : 'http'}://${MINIO_ENDPOINT}:${MINIO_PORT}`
    ).replace(/\/$/, '');
    
    const region = process.env.MINIO_REGION || 'us-east-1'; // com região fixa, assinar não faz chamada de rede
    const pub = new URL(this.minioBaseUrl);
    this.signer = new Client({
      endPoint: pub.hostname,
      port: pub.port ? Number(pub.port) : pub.protocol === 'https:' ? 443 : 80,
      useSSL: pub.protocol === 'https:',
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
      region,
    });

    this.client = new Client({
      endPoint: MINIO_ENDPOINT,
      port: parseInt(MINIO_PORT, 10),
      useSSL: MINIO_USE_SSL?.toLowerCase() === 'true',
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    });
  }

  async ensureBucketExists(bucketName: string): Promise<void> {
    const exists = await this.client.bucketExists(bucketName);
    if (!exists) {
      await this.client.makeBucket(bucketName);
      
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      
      await this.client.setBucketPolicy(bucketName, JSON.stringify(policy));
    } else {
      try {
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };
        
        await this.client.setBucketPolicy(bucketName, JSON.stringify(policy));
      } catch (error) {
      
      }
    }
  }

  async configureCors(): Promise<void> {
    return;
  }

  async uploadStream(
    bucketName: string, 
    objectName: string, 
    stream: Readable, 
    size?: number
  ): Promise<{ etag: string }> {
    await this.ensureBucketExists(bucketName);
    
    return this.client.putObject(
      bucketName, 
      objectName, 
      stream, 
      size
    );
  }

  /** URL pré-assinada de envio (PUT) para o navegador; o arquivo não passa pelo servidor web. */
  async presignPut(bucketName: string, objectName: string, expirySeconds: number): Promise<string> {
    await this.ensureBucketExists(bucketName);
    return this.signer.presignedPutObject(bucketName, objectName, expirySeconds);
  }

  /** Inicia um envio em partes e devolve o uploadId. */
  async initMultipart(bucketName: string, objectName: string, contentType: string): Promise<string> {
    await this.ensureBucketExists(bucketName);
    return this.client.initiateNewMultipartUpload(bucketName, objectName, { 'Content-Type': contentType });
  }

  /** URL pré-assinada (endereço público) para o navegador enviar UMA parte. */
  presignPart(bucketName: string, objectName: string, uploadId: string, partNumber: number, expirySeconds: number): Promise<string> {
    return this.signer.presignedUrl('PUT', bucketName, objectName, expirySeconds, { partNumber: String(partNumber), uploadId });
  }

  async completeMultipart(bucketName: string, objectName: string, uploadId: string, parts: { part: number; etag: string }[]) {
    return this.client.completeMultipartUpload(bucketName, objectName, uploadId, parts);
  }

  async abortMultipart(bucketName: string, objectName: string, uploadId: string): Promise<void> {
    await this.client.abortMultipartUpload(bucketName, objectName, uploadId);
  }

  /** Metadados do objeto (tamanho e tipo) para conferir o que o cliente realmente enviou. */
  async statObject(bucketName: string, objectName: string) {
    return this.client.statObject(bucketName, objectName);
  }

  /** Lista os objetos do bucket (com teto, para não carregar milhões de itens de uma vez). */
  async listAll(bucketName: string, max = 50_000): Promise<{ name: string; lastModified: Date; size: number }[]> {
    if (!(await this.client.bucketExists(bucketName))) return [];
    return new Promise((resolve, reject) => {
      const out: { name: string; lastModified: Date; size: number }[] = [];
      const stream = this.client.listObjectsV2(bucketName, '', true);
      stream.on('data', (o: BucketItem) => {
        if (o.name && out.length < max) out.push({ name: o.name, lastModified: o.lastModified ?? new Date(), size: o.size ?? 0 });
      });
      stream.on('error', reject);
      stream.on('end', () => resolve(out));
    });
  }

  async deleteObject(bucketName: string, objectName: string): Promise<void> {
    await this.client.removeObject(bucketName, objectName);
  }

  async deleteBucket(bucketName: string): Promise<void> {
    {
      const objectsList = this.client.listObjects(bucketName, '', true);
      const objectsToDelete: string[] = [];
      
      await new Promise<void>((resolve, reject) => {
        objectsList.on('data', (obj: BucketItem) => {
          if (obj && typeof obj.name === 'string') {
            objectsToDelete.push(obj.name);
          }
        });

        objectsList.on('error', reject);
        
        objectsList.on('end', async () => {
          try {
            if (objectsToDelete.length > 0) {
              await this.client.removeObjects(bucketName, objectsToDelete);
            }
            await this.client.removeBucket(bucketName);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    }
  }

  getFormattedUrl(containerName: string, blobName: string): string {
    return `${this.minioBaseUrl}/${containerName}/${blobName}`;
  }

  async replaceFile(
    containerName: string,
    oldUrl: string,
    stream: Readable,
    newFilename: string,
    streamLength?: number
  ): Promise<string> {
    {
      const oldFilename = extractFilenameFromUrl(oldUrl);
      
      if (oldFilename) {
        await this.deleteObject(containerName, oldFilename);
      }
      
      await this.uploadStream(
        containerName, 
        newFilename, 
        stream, 
        streamLength
      );
      
      return this.getFormattedUrl(containerName, newFilename);
    }
  }
}
