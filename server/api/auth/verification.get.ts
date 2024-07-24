import { verifyUser } from '~/server/database/verificationCode';
import { codeQuerySchema } from '~/schemas/codeQuery';

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, codeQuerySchema.parse);

  try {
    await verifyUser(query.id, query.code);
  }
  catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'error/not-found',
    });
  }
});
