const { createClient } = require('@supabase/supabase-js');
const multiparty = require('multiparty');
const fs = require('fs');

const supabase = createClient(
  'https://<YOUR_SUPABASE_URL>.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const form = new multiparty.Form();

  return new Promise((resolve, reject) => {
    form.parse(event, async (err, fields, files) => {
      if (err) return reject({ statusCode: 500, body: err.message });

      const file = files.photo[0];
      const discord = fields.discord[0];
      const description = fields.description[0];
      const tags = JSON.parse(fields.tags[0]);

      const filename = `${Date.now()}_${file.originalFilename}`;
      const fileContent = fs.readFileSync(file.path);

      // Upload naar Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filename, fileContent, {
          contentType: file.headers['content-type'],
        });

      if (uploadError) {
        return resolve({ statusCode: 500, body: JSON.stringify(uploadError) });
      }

      const publicUrl = `https://<YOUR_SUPABASE_URL>.supabase.co/storage/v1/object/public/photos/${filename}`;

      // Metadata opslaan
      const { error: dbError } = await supabase.from('uploads').insert([
        {
          url: publicUrl,
          filename,
          discord,
          description,
          tags,
        },
      ]);

      if (dbError) {
        return resolve({ statusCode: 500, body: JSON.stringify(dbError) });
      }

      return resolve({
        statusCode: 200,
        body: JSON.stringify({ message: 'Upload gelukt!' }),
      });
    });
  });
};
