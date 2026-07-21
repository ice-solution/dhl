#!/usr/bin/env node
/**
 * Pack uploaded photos for production delivery.
 *
 * Source:  public/uploads/{MongoDB ObjectId}/uniform-*.jpg|png, nice-*.jpg|png
 * Output:  {outputDir}/{Business Unit}/{email}/uniform.ext, nice.ext
 *
 * Usage (on production server, from project root):
 *   node scripts/pack-photos.js
 *   node scripts/pack-photos.js --dry-run
 *   node scripts/pack-photos.js --output=/tmp/photo-export
 *   node scripts/pack-photos.js --zip
 *
 * Requires: MONGODB_URI in .env (or environment)
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const { isStoredPhotoPath } = require('../lib/upload-photos');

const UPLOAD_ROOT = path.join(__dirname, '..', 'public', 'uploads');
const DEFAULT_OUTPUT = path.join(__dirname, '..', 'exports', 'photos-pack');

function parseArgs(argv) {
  const args = {
    dryRun: false,
    zip: false,
    output: DEFAULT_OUTPUT,
  };

  argv.forEach((arg) => {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--zip') args.zip = true;
    else if (arg.startsWith('--output=')) args.output = path.resolve(arg.slice('--output='.length));
  });

  return args;
}

/** Only sanitize business unit — email stays as-is (原樣). */
function sanitizeBusinessUnit(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Unknown Business Unit';
  return trimmed.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

function resolvePhotoPath(storedPath) {
  if (!isStoredPhotoPath(storedPath)) return null;
  const relative = storedPath.replace(/^\/uploads\//, '');
  return path.join(UPLOAD_ROOT, relative);
}

function getExtension(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  if (ext === '.jpeg') return '.jpg';
  if (['.jpg', '.png'].includes(ext)) return ext;
  return '.jpg';
}

async function copyPhoto(sourcePath, destPath, dryRun) {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return { ok: false, reason: 'file not found' };
  }

  if (dryRun) {
    return { ok: true, reason: 'dry-run' };
  }

  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  await fs.promises.copyFile(sourcePath, destPath);
  return { ok: true, reason: 'copied' };
}

function createZip(outputDir) {
  const parent = path.dirname(outputDir);
  const base = path.basename(outputDir);
  const zipPath = `${outputDir}.zip`;

  execSync(`cd "${parent}" && zip -r "${zipPath}" "${base}"`, { stdio: 'inherit' });
  return zipPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to .env or export it before running.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);

  const users = await User.find().lean();
  const applications = await Application.find().lean();
  const appByUser = Object.fromEntries(applications.map((a) => [a.user.toString(), a]));

  const manifest = {
    generatedAt: new Date().toISOString(),
    outputDir: args.output,
    dryRun: args.dryRun,
    summary: {
      usersScanned: users.length,
      usersWithPhotos: 0,
      filesCopied: 0,
      filesMissing: 0,
      skippedNoPhoto: 0,
    },
    entries: [],
    missing: [],
  };

  console.log(`Upload root: ${UPLOAD_ROOT}`);
  console.log(`Output dir:  ${args.output}`);
  if (args.dryRun) console.log('Mode: dry-run (no files will be written)');

  for (const user of users) {
    const userId = user._id.toString();
    const app = appByUser[userId];
    const photos = app?.photoUpload || {};
    const uniformSrc = resolvePhotoPath(photos.uniformPhoto);
    const niceSrc = resolvePhotoPath(photos.nicePhoto);

    if (!uniformSrc && !niceSrc) {
      manifest.summary.skippedNoPhoto += 1;
      continue;
    }

    manifest.summary.usersWithPhotos += 1;

    const email = user.userId || app?.accountLogin?.userId || '';
    const businessUnit = sanitizeBusinessUnit(
      user.businessUnit || app?.accountLogin?.businessUnit || ''
    );

    const entry = {
      email,
      businessUnit,
      userObjectId: userId,
      fullName: user.fullName || app?.accountLogin?.fullName || '',
      category: user.category || app?.accountLogin?.category || '',
      files: [],
    };

    const destDir = path.join(args.output, businessUnit, email);

    const tasks = [
      { type: 'uniform', src: uniformSrc },
      { type: 'nice', src: niceSrc },
    ];

    for (const task of tasks) {
      if (!task.src) continue;

      const destPath = path.join(destDir, `${task.type}${getExtension(task.src)}`);
      const result = await copyPhoto(task.src, destPath, args.dryRun);

      entry.files.push({
        type: task.type,
        source: task.src,
        destination: destPath,
        ...result,
      });

      if (result.ok) {
        manifest.summary.filesCopied += 1;
      } else {
        manifest.summary.filesMissing += 1;
        manifest.missing.push({
          email,
          businessUnit,
          type: task.type,
          source: task.src,
          reason: result.reason,
        });
      }
    }

    manifest.entries.push(entry);
  }

  const manifestPath = path.join(args.output, 'manifest.json');
  if (!args.dryRun) {
    await fs.promises.mkdir(args.output, { recursive: true });
    await fs.promises.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }

  console.log('\n--- Summary ---');
  console.log(`Users scanned:        ${manifest.summary.usersScanned}`);
  console.log(`Users with photos:    ${manifest.summary.usersWithPhotos}`);
  console.log(`Files copied:         ${manifest.summary.filesCopied}`);
  console.log(`Files missing:      ${manifest.summary.filesMissing}`);
  console.log(`Users without photos: ${manifest.summary.skippedNoPhoto}`);

  if (manifest.missing.length) {
    console.log('\nMissing files:');
    manifest.missing.forEach((item) => {
      console.log(`  - ${item.email} (${item.businessUnit}) ${item.type}: ${item.source}`);
    });
  }

  if (!args.dryRun) {
    console.log(`\nManifest written to: ${manifestPath}`);

    if (args.zip) {
      try {
        const zipPath = createZip(args.output);
        console.log(`Zip created: ${zipPath}`);
      } catch (err) {
        console.error('\nZip failed. Ensure the "zip" command is installed, or zip manually:');
        console.error(`  cd "${path.dirname(args.output)}" && zip -r "${path.basename(args.output)}.zip" "${path.basename(args.output)}"`);
        console.error(err.message);
      }
    }
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  mongoose.disconnect().finally(() => process.exit(1));
});
