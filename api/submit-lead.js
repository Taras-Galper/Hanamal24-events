// Serverless function to submit leads to Airtable
// Deploy this to Vercel for automatic Airtable submission

const AIRTABLE_BASE_ID = 'appeW41fJAbVdeWoU';
const AIRTABLE_TABLE_ID = 'tblTMBjuWZ8BATqTj';

// Vercel serverless function handler
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the request body
    const leadData = req.body;
    
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'phone', 'eventType', 'guestCount', 'eventDate'];
    const missingFields = requiredFields.filter(field => !leadData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    // Check if Airtable token is available
    if (!process.env.AIRTABLE_TOKEN) {
      console.error('AIRTABLE_TOKEN environment variable is not set');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Airtable token not configured'
      });
    }

    // Format data for Airtable
    const airtableData = {
      fields: {
        'שם מלא': leadData.fullName,
        'אימייל': leadData.email,
        'טלפון': leadData.phone,
        'סוג אירוע': leadData.eventType,
        'מספר אורחים': leadData.guestCount,
        'תאריך האירוע': leadData.eventDate,
        'הודעה נוספת': leadData.message || '',
        'תאריך יצירת הליד': new Date().toISOString().split('T')[0],
        'סטטוס': 'חדש',
        'מקור': 'אתר אינטרנט'
      }
    };

    console.log('Submitting to Airtable:', airtableData);

    // Submit to Airtable
    const airtableResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtableData)
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error('Airtable API error:', errorText);
      return res.status(500).json({ 
        error: 'Airtable API error',
        message: `Failed to submit to Airtable: ${airtableResponse.status}`,
        details: errorText
      });
    }

    const result = await airtableResponse.json();
    console.log('Lead submitted successfully to Airtable:', result);

    return res.status(200).json({ 
      success: true, 
      message: 'Lead submitted successfully to Airtable',
      leadId: result.id,
      airtableRecord: result
    });

  } catch (error) {
    console.error('Error submitting lead:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
