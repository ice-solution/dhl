/**
 * PHOTO UPLOAD copy from fields_details.xlsx → sheet "PHOTO UPLOAD"
 */
const PHOTO_UPLOAD_COPY = {
  instructions: [
    {
      html: 'Awardee Photo (<span class="app-photo-underline">Front, Portrait, Adequate Lighting, Clean Background</span>)',
    },
    'Coloured copy with high resolution (Minimum: 1MB in jpeg / jpg / png format )',
    'Please name the file with your Business Unit and Full Name (e.g. HK_Simon Chan Tai Man Photo / HK_Simon Chan Tai Man Nice Photo)',
    {
      html: 'Please note the deadline to receive the photos is <strong><span class="app-photo-underline">24 July 2026</span></strong>, the collected photos will be used for event production.',
    },
  ],
  referenceImages: [
    {
      label: 'DHL Photo Reference',
      src: '/images/formal.jpg',
      alt: 'DHL uniform photo reference example',
    },
    {
      label: 'Nice Photo Reference',
      src: '/images/nice.jpg',
      alt: 'Nice photo reference example',
    },
  ],
  referenceCaption: 'Photo here for reference',
};

function getPhotoUploadCopy() {
  return PHOTO_UPLOAD_COPY;
}

module.exports = {
  PHOTO_UPLOAD_COPY,
  getPhotoUploadCopy,
};
