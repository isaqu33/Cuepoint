import { prisma } from '../../utils/db';

export async function updateCourseInOurBase(
  idCourse: string,
  title: string,
  text: string,
  seriesIds: string,
  userId: string,
  pathImg?: string,
  file?: {
    size: string;
    type: string;
    name: string;
    lastModified: string;
    path: string;
  }[],
) {
  const seriesIdsArray = seriesIds ? seriesIds.split(',') : [];

  // Prepare data for update - only include fields that have values
  const updateData: any = {
    title: title,
    about: text,
    updatedByUserId: userId,
  };

  // Add photoLeson only if provided
  if (pathImg) {
    updateData.photoLeson = pathImg;
  }

  // Configure series relationships only if provided
  if (seriesIds && seriesIdsArray.length > 0) {
    updateData.series = {
      set: seriesIdsArray.map((name) => ({ title: name })),
    };
  }

  // Update course record
  const result = await prisma.collection.update({
    where: {
      id: idCourse,
    },
    data: updateData,
    include: {
      series: true,
      files: true,
    },
  });

  // Clear relationships if empty string provided
  if (seriesIds === '') {
    await prisma.collection.update({
      where: {
        id: idCourse,
      },
      data: {
        series: {
          disconnect: result?.series?.map(({ id }) => ({ id })),
        },
      },
    });
  }

  // Update associated file if there's a new file
  if (file && file.length > 0 && result.files.length > 0) {
    // Delete the old file record
    await prisma.file.delete({
      where: {
        id: result.files[0].id,
      },
    });

    // Create new file record
    await prisma.collection.update({
      where: {
        id: idCourse,
      },
      data: {
        updatedByUserId: userId,
        files: {
          create: file.map((fileItem) => ({
            size: fileItem.size,
            type: fileItem.type,
            name: fileItem.name,
            lastModified: fileItem.lastModified,
            path: fileItem.path,
            createdByUserId: userId,
          })),
        },
      },
    });
  }

  return result;
}
