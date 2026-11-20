import { Client } from 'minio';
import process from 'process';

function createMinioClient(): Client {
  const { MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_USE_SSL } =
    process.env;

  return new Client({
    endPoint: MINIO_ENDPOINT || '',
    port: MINIO_PORT ? parseInt(MINIO_PORT, 10) : 9000,
    useSSL: MINIO_USE_SSL?.toLowerCase() === 'true',
    accessKey: MINIO_ACCESS_KEY || '',
    secretKey: MINIO_SECRET_KEY || '',
  });
}

async function objectExists(bucketName: string, objectName: string): Promise<boolean> {
  try {
    const minioClient = createMinioClient();
    await minioClient.statObject(bucketName, objectName);
    return true;
  } catch {
    return false;
  }
}

async function listBucket(bucketName: string): Promise<string[]> {
  const minioClient = createMinioClient();
  const objectsList: string[] = [];

  try {
    const stream = minioClient.listObjects(bucketName, '', true);

    await new Promise<void>((resolve) => {
      stream.on('data', (item) => {
        if (item.name) {
          objectsList.push(item.name);
        }
      });

      stream.on('end', () => {
        resolve();
      });

      stream.on('error', () => {
        resolve();
      });
    });
  } catch (error) {
    console.error(`Error listing bucket ${bucketName}:`, error);
  }

  return objectsList;
}

function extractIdentifiers(url: string): string[] {
  if (!url) return [];

  const identifiers = new Set<string>();

  let cleanUrl = url;

  if (typeof url === 'string' && url.startsWith('"') && url.endsWith('"')) {
    try {
      cleanUrl = JSON.parse(url);
    } catch {}
  }

  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const uuidMatch = cleanUrl.match(uuidPattern);
  if (uuidMatch) {
    identifiers.add(uuidMatch[0]);
  }

  const filenamePattern = /\/([^/]+\.[^/.]+)(?:\?|"|$)/;
  const filenameMatch = cleanUrl.match(filenamePattern);
  if (filenameMatch && filenameMatch[1]) {
    identifiers.add(filenameMatch[1]);
  }

  const lastSegment = cleanUrl.split('/').pop();
  if (lastSegment) {
    identifiers.add(lastSegment);

    const withoutParams = lastSegment.split('?')[0];
    if (withoutParams && withoutParams !== lastSegment) {
      identifiers.add(withoutParams);
    }
  }

  return Array.from(identifiers);
}

async function findAndDeleteByIdentifiers(bucketName: string, url: string): Promise<boolean> {
  const identifiers = extractIdentifiers(url);
  if (identifiers.length === 0) return false;

  const allObjects = await listBucket(bucketName);

  const matchingObjects = allObjects.filter((objName) =>
    identifiers.some((id) => objName.includes(id)),
  );

  if (matchingObjects.length > 0) {
    const minioClient = createMinioClient();
    let deletedAny = false;

    for (const objName of matchingObjects) {
      try {
        await minioClient.removeObject(bucketName, objName);
        deletedAny = true;
      } catch (error) {}
    }

    return deletedAny;
  }

  return false;
}

async function deleteObject(bucketName: string, objectName: string): Promise<boolean> {
  try {
    const minioClient = createMinioClient();

    const exists = await objectExists(bucketName, objectName);
    if (!exists) return false;

    await minioClient.removeObject(bucketName, objectName);

    return true;
  } catch (error) {
    return false;
  }
}

export async function deleteMinioFile(bucketName: string, url: string): Promise<boolean> {
  if (!url || !bucketName) return false;

  const identifiers = extractIdentifiers(url);

  for (const id of identifiers) {
    const success = await deleteObject(bucketName, id);
    if (success) {
      return true;
    }
  }

  const foundAndDeleted = await findAndDeleteByIdentifiers(bucketName, url);

  return foundAndDeleted;
}

export async function deleteLessonFiles(
  photoUrl?: string | null,
  audioUrl?: string | null,
): Promise<void> {
  const bucketName = 'lessons';

  if (photoUrl) {
    const photoDeleted = await deleteMinioFile(bucketName, photoUrl);
  }

  if (audioUrl) {
    const audioDeleted = await deleteMinioFile(bucketName, audioUrl);
  }
}

export async function deleteCourseFiles(photoUrl?: string | null): Promise<void> {
  if (photoUrl) {
    await deleteMinioFile('courses', photoUrl);
  }
}

export async function deleteSeriesFiles(photoUrl?: string | null): Promise<void> {
  if (photoUrl) {
    await deleteMinioFile('series', photoUrl);
  }
}
