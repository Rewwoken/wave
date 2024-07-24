import crypto from 'node:crypto';
import { prisma } from '~/server/database/index';

export async function createVerificationCode(userId: string) {
  const randomCode = crypto.randomBytes(128).toString('hex');

  return prisma.verificationCode.create({
    data: {
      value: randomCode,
      user: {
        connect: { id: userId },
      },
    },
  });
}

export async function verifyUser(userId: string, code: string) {
  return prisma.$transaction([
    prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
        verificationCode: { value: code },
      },
    }),
    prisma.user.update({
      where: {
        id: userId,
        verificationCode: { value: code },
      },
      data: {
        verified: new Date(),
      },
    }),
    prisma.verificationCode.delete({
      where: {
        userId,
        value: code,
      },
    }),
  ]);
}
