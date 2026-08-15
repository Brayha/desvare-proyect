/**
 * Reconstruye totalEarnings y totalServices de cada conductor
 * a partir de sus servicios completed.
 *
 * Por seguridad funciona en modo dry-run. Para aplicar:
 *   node scripts/backfillDriverEarnings.js --apply
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Request = require('../models/Request');

const shouldApply = process.argv.includes('--apply');

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI no está configurada');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const totals = await Request.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: { $ifNull: ['$completedBy', '$assignedDriverId'] },
        totalEarnings: { $sum: { $ifNull: ['$totalAmount', 0] } },
        totalServices: { $sum: 1 },
      },
    },
  ]);

  const drivers = await User.find({ userType: 'driver' })
    .select('_id name driverProfile.totalEarnings driverProfile.totalServices')
    .lean();

  const totalsByDriver = new Map(
    totals
      .filter((row) => row._id)
      .map((row) => [row._id.toString(), row]),
  );

  const operations = [];
  const preview = [];

  for (const driver of drivers) {
    const stats = totalsByDriver.get(driver._id.toString()) || {
      totalEarnings: 0,
      totalServices: 0,
    };
    const currentEarnings = driver.driverProfile?.totalEarnings || 0;
    const currentServices = driver.driverProfile?.totalServices || 0;

    if (
      currentEarnings === stats.totalEarnings
      && currentServices === stats.totalServices
    ) {
      continue;
    }

    preview.push({
      driverId: driver._id.toString(),
      name: driver.name,
      from: { totalEarnings: currentEarnings, totalServices: currentServices },
      to: { totalEarnings: stats.totalEarnings, totalServices: stats.totalServices },
    });

    operations.push({
      updateOne: {
        filter: { _id: driver._id },
        update: {
          $set: {
            'driverProfile.totalEarnings': stats.totalEarnings,
            'driverProfile.totalServices': stats.totalServices,
          },
        },
      },
    });
  }

  console.log(JSON.stringify({
    mode: shouldApply ? 'apply' : 'dry-run',
    drivers: drivers.length,
    updates: operations.length,
    preview: preview.slice(0, 20),
  }, null, 2));

  if (shouldApply && operations.length > 0) {
    const result = await User.bulkWrite(operations, { ordered: false });
    console.log(`Conductores actualizados: ${result.modifiedCount}`);
  } else if (!shouldApply) {
    console.log('No se modificó la base de datos. Usa --apply después de revisar el resumen.');
  }
};

run()
  .catch((error) => {
    console.error('Error reconstruyendo ganancias de conductores:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
