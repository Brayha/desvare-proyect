/**
 * Reconstruye totalAmount y acceptedAt para solicitudes históricas.
 *
 * Por seguridad funciona en modo dry-run. Para aplicar:
 *   node scripts/backfillRequestFinancials.js --apply
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Request = require('../models/Request');

const shouldApply = process.argv.includes('--apply');

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI no está configurada');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const requests = await Request.find({
    status: { $in: ['accepted', 'in_progress', 'completed'] },
    $or: [
      { totalAmount: { $exists: false } },
      { totalAmount: 0 },
      { acceptedAt: null },
    ],
  }).select('_id quotes totalAmount acceptedAt').lean();

  const operations = [];
  let withoutAcceptedQuote = 0;

  for (const request of requests) {
    const acceptedQuote = request.quotes?.find(quote => quote.status === 'accepted');
    if (!acceptedQuote?.amount) {
      withoutAcceptedQuote++;
      continue;
    }

    const update = {};
    if (!request.totalAmount) update.totalAmount = acceptedQuote.amount;
    if (!request.acceptedAt) {
      update.acceptedAt = acceptedQuote.timestamp || new Date();
    }

    if (Object.keys(update).length > 0) {
      operations.push({
        updateOne: {
          filter: { _id: request._id },
          update: { $set: update },
        },
      });
    }
  }

  console.log(JSON.stringify({
    mode: shouldApply ? 'apply' : 'dry-run',
    candidates: requests.length,
    updates: operations.length,
    withoutAcceptedQuote,
  }, null, 2));

  if (shouldApply && operations.length > 0) {
    const result = await Request.bulkWrite(operations, { ordered: false });
    console.log(`Solicitudes actualizadas: ${result.modifiedCount}`);
  } else if (!shouldApply) {
    console.log('No se modificó la base de datos. Usa --apply después de revisar el resumen.');
  }
};

run()
  .catch((error) => {
    console.error('Error reconstruyendo datos financieros:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
