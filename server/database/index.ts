import { PrismaClient } from '@prisma/client';
import { cloudinaryDestroy, cloudinaryUpload } from '~/server/cloudinary';
import { CLOUDINARY_FOLDERS } from '~/server/cloudinary/constants';

// ? TODO: move extensions to their own file
export const prisma = new PrismaClient()
	.$extends({
		model: {
			post: {
				async createMediaFiles(postId: string, files: ValidatedFormFile[]) {
					Promise.all(files.map(async (file) => {
						const { public_id, version } = await cloudinaryUpload(file.filepath, {
							folder: CLOUDINARY_FOLDERS.POSTS,
							resource_type: file.type,
						});

						await prisma.mediaFile.create({
							data: {
								post: { connect: { id: postId } },
								publicId: public_id,
								url: `v${version}/${public_id}`,
								mimetype: file.mimetype,
							},
						});
					}));
				},
				async deleteMediaFiles(postId: string) {
					// Prisma doesn't support `DELETE ... RETURNING *`, so we need to fetch the media files first
					const mediaFiles = await prisma.mediaFile.findMany({
						where: { postId },
						select: { publicId: true },
					});

					await Promise.allSettled(
						mediaFiles.map(file => cloudinaryDestroy(file.publicId)),
					);

					await prisma.mediaFile.deleteMany({ where: { postId } });
				},
			},
		},
		query: {
			post: {
				delete: async ({ args, query }) => {
					const mediaFiles = await prisma.mediaFile.findMany({
						where: { postId: args.where.id },
						select: { publicId: true },
					});

					await Promise.allSettled(
						mediaFiles.map(file => cloudinaryDestroy(file.publicId)),
					);

					return query(args);
				},
			},
		},
	});
